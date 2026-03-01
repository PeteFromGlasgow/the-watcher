package controller

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
	"sigs.k8s.io/controller-runtime/pkg/log"

	watcherv1alpha1 "github.com/petefromglasgow/the-watcher/operator/api/v1alpha1"
)

const (
	// dbIDAnnotation is the annotation key storing the PostgreSQL UUID for this Watch.
	// TODO: Add a validation webhook to enforce this annotation on creation.
	dbIDAnnotation = "watcher.io/db-id"

	// requeueInterval is how often the reconciler re-checks run_log for status updates.
	requeueInterval = 2 * time.Minute

	// cronJobPrefix is prepended to the Watch CR name to form the CronJob name.
	cronJobPrefix = "watch-"

	// pipelineImage is the CLI container image that runs watch:run.
	pipelineImage = "ghcr.io/petefromglasgow/the-watcher/cli:latest"

	// dbSecretName is the Kubernetes Secret holding DATABASE_URL.
	dbSecretName = "watcher-db-credentials"
)

// WatchReconciler reconciles Watch custom resources.
//
// +kubebuilder:rbac:groups=watcher.io,resources=watches,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=watcher.io,resources=watches/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=watcher.io,resources=watches/finalizers,verbs=update
// +kubebuilder:rbac:groups=batch,resources=cronjobs,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core,resources=secrets,verbs=get;list;watch
// +kubebuilder:rbac:groups=core,resources=events,verbs=create;patch
type WatchReconciler struct {
	client.Client
	Scheme *runtime.Scheme
	DB     *sql.DB
}

// Reconcile is the main reconciliation loop. It is called whenever a Watch CR changes
// or after the requeue interval elapses (to pick up new run_log entries).
func (r *WatchReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	logger := log.FromContext(ctx)

	var watch watcherv1alpha1.Watch
	if err := r.Get(ctx, req.NamespacedName, &watch); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	// Reconcile the CronJob for this Watch (WCH-36).
	if err := r.reconcileCronJob(ctx, &watch); err != nil {
		logger.Error(err, "Failed to reconcile CronJob")
		return ctrl.Result{}, err
	}

	// Reconcile status from run_log (WCH-37). Non-fatal — CronJob management takes priority.
	if err := r.reconcileStatus(ctx, &watch); err != nil {
		logger.Error(err, "Failed to reconcile status from run_log")
	}

	return ctrl.Result{RequeueAfter: requeueInterval}, nil
}

// reconcileCronJob creates or updates the CronJob corresponding to the Watch CR.
func (r *WatchReconciler) reconcileCronJob(ctx context.Context, watch *watcherv1alpha1.Watch) error {
	logger := log.FromContext(ctx)

	desired := r.buildCronJob(watch)

	if err := controllerutil.SetControllerReference(watch, desired, r.Scheme); err != nil {
		return fmt.Errorf("setting controller reference: %w", err)
	}

	existing := &batchv1.CronJob{}
	err := r.Get(ctx, types.NamespacedName{Name: desired.Name, Namespace: desired.Namespace}, existing)
	if errors.IsNotFound(err) {
		logger.Info("Creating CronJob", "name", desired.Name)
		return r.Create(ctx, desired)
	}
	if err != nil {
		return fmt.Errorf("getting CronJob: %w", err)
	}

	// Patch the schedule and env vars if the Watch spec has changed.
	patch := existing.DeepCopy()
	patch.Spec.Schedule = watch.Spec.Schedule
	patch.Spec.JobTemplate.Spec.Template.Spec.Containers[0].Env = desired.Spec.JobTemplate.Spec.Template.Spec.Containers[0].Env

	if err := r.Update(ctx, patch); err != nil {
		return fmt.Errorf("updating CronJob: %w", err)
	}

	return nil
}

// buildCronJob constructs the desired CronJob for the given Watch.
func (r *WatchReconciler) buildCronJob(watch *watcherv1alpha1.Watch) *batchv1.CronJob {
	dbID := watch.Annotations[dbIDAnnotation]

	forbid := batchv1.ForbidConcurrent
	onFailure := corev1.RestartPolicyOnFailure

	envVars := []corev1.EnvVar{
		{
			Name: "DATABASE_URL",
			ValueFrom: &corev1.EnvVarSource{
				SecretKeyRef: &corev1.SecretKeySelector{
					LocalObjectReference: corev1.LocalObjectReference{Name: dbSecretName},
					Key:                  "url",
				},
			},
		},
	}

	// Mount each secretRef from the transport chain as an env var.
	for _, entry := range watch.Spec.Transport.Chain {
		if entry.SecretRef != "" {
			envVarName := "WATCHER_SECRET_" + strings.ToUpper(strings.ReplaceAll(entry.SecretRef, "-", "_"))
			envVars = append(envVars, corev1.EnvVar{
				Name: envVarName,
				ValueFrom: &corev1.EnvVarSource{
					SecretKeyRef: &corev1.SecretKeySelector{
						LocalObjectReference: corev1.LocalObjectReference{Name: entry.SecretRef},
						Key:                  "value",
					},
				},
			})
		}
	}

	// Mount each notifier secretRef as an env var.
	for _, n := range watch.Spec.Notifiers {
		if n.SecretRef != "" {
			envVarName := "WATCHER_SECRET_" + strings.ToUpper(strings.ReplaceAll(n.SecretRef, "-", "_"))
			envVars = append(envVars, corev1.EnvVar{
				Name: envVarName,
				ValueFrom: &corev1.EnvVarSource{
					SecretKeyRef: &corev1.SecretKeySelector{
						LocalObjectReference: corev1.LocalObjectReference{Name: n.SecretRef},
						Key:                  "value",
					},
				},
			})
		}
	}

	return &batchv1.CronJob{
		ObjectMeta: metav1.ObjectMeta{
			Name:      cronJobPrefix + watch.Name,
			Namespace: watch.Namespace,
		},
		Spec: batchv1.CronJobSpec{
			Schedule:          watch.Spec.Schedule,
			ConcurrencyPolicy: forbid,
			JobTemplate: batchv1.JobTemplateSpec{
				Spec: batchv1.JobSpec{
					Template: corev1.PodTemplateSpec{
						Spec: corev1.PodSpec{
							RestartPolicy: onFailure,
							Containers: []corev1.Container{
								{
									Name:    "watcher-pipeline",
									Image:   pipelineImage,
									Command: []string{"node", "dist/index.js", "watch:run", dbID},
									Env:     envVars,
								},
							},
						},
					},
				},
			},
		},
	}
}

// reconcileStatus queries run_log and writes the latest run outcome back to the Watch status.
func (r *WatchReconciler) reconcileStatus(ctx context.Context, watch *watcherv1alpha1.Watch) error {
	if r.DB == nil {
		return nil
	}

	dbID := watch.Annotations[dbIDAnnotation]
	if dbID == "" {
		return nil // No DB ID annotation yet — skip status update.
	}

	row := r.DB.QueryRowContext(ctx, `
		SELECT completed_at, transport_used, listings_found, new_listings, errors
		FROM run_log
		WHERE watch_id = $1 AND completed_at IS NOT NULL
		ORDER BY completed_at DESC
		LIMIT 1
	`, dbID)

	var completedAt time.Time
	var transportUsed string
	var listingsFound, newListings int
	var errorsJSON []byte

	if err := row.Scan(&completedAt, &transportUsed, &listingsFound, &newListings, &errorsJSON); err != nil {
		if err == sql.ErrNoRows {
			return nil // No runs yet — leave status empty.
		}
		return fmt.Errorf("querying run_log: %w", err)
	}

	var runErrors []string
	_ = json.Unmarshal(errorsJSON, &runErrors)

	runStatus := "Success"
	if len(runErrors) > 0 {
		runStatus = "Failed"
	}

	completedTime := metav1.NewTime(completedAt)
	watch.Status = watcherv1alpha1.WatchStatus{
		LastRunTime:   &completedTime,
		LastRunStatus: runStatus,
		ListingsFound: listingsFound,
		NewListings:   newListings,
		TransportUsed: transportUsed,
	}

	return r.Status().Update(ctx, watch)
}

// SetupWithManager registers the WatchReconciler with the controller manager.
func (r *WatchReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&watcherv1alpha1.Watch{}).
		Owns(&batchv1.CronJob{}).
		Complete(r)
}
