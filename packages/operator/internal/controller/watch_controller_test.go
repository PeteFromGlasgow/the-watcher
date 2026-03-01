package controller_test

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	batchv1 "k8s.io/api/batch/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes/scheme"
	ctrl "sigs.k8s.io/controller-runtime"

	watcherv1alpha1 "github.com/petefromglasgow/the-watcher/operator/api/v1alpha1"
	"github.com/petefromglasgow/the-watcher/operator/internal/controller"
)

// mockRows implements sql.Rows for testing.
type mockRows struct {
	values []driver.Value
	scanned bool
}

func (m *mockRows) Columns() []string {
	return []string{"completed_at", "transport_used", "listings_found", "new_listings", "errors"}
}

func (m *mockRows) Close() error { return nil }

func (m *mockRows) Next(dest []driver.Value) error {
	if m.scanned {
		return sql.ErrNoRows
	}
	m.scanned = true
	copy(dest, m.values)
	return nil
}

var _ = Describe("WatchReconciler", func() {
	const (
		watchName      = "test-watch"
		watchNamespace = "default"
		testDBID       = "550e8400-e29b-41d4-a716-446655440000"
	)

	ctx := context.Background()

	makeWatch := func() *watcherv1alpha1.Watch {
		return &watcherv1alpha1.Watch{
			ObjectMeta: metav1.ObjectMeta{
				Name:      watchName,
				Namespace: watchNamespace,
				Annotations: map[string]string{
					"watcher.io/db-id": testDBID,
				},
			},
			Spec: watcherv1alpha1.WatchSpec{
				URL:     "https://www.gumtree.com/search?q=vw+crafter",
				Adapter: "gumtree",
				Transport: watcherv1alpha1.TransportChainConfig{
					Chain: []watcherv1alpha1.TransportEntry{
						{Name: "http"},
						{Name: "flaresolverr"},
					},
				},
				Schedule: "*/30 * * * *",
				Notifiers: []watcherv1alpha1.NotifierEntry{
					{Type: "telegram", SecretRef: "telegram-alerts"},
				},
				SimilarityThreshold: 0.85,
				Enabled:             true,
			},
		}
	}

	setupReconciler := func(db *sql.DB) *controller.WatchReconciler {
		err := watcherv1alpha1.AddToScheme(scheme.Scheme)
		Expect(err).NotTo(HaveOccurred())

		return &controller.WatchReconciler{
			Client: k8sClient,
			Scheme: scheme.Scheme,
			DB:     db,
		}
	}

	Context("CronJob management", func() {
		It("creates a CronJob when a Watch CR is created", func() {
			watch := makeWatch()
			Expect(k8sClient.Create(ctx, watch)).To(Succeed())
			DeferCleanup(func() { _ = k8sClient.Delete(ctx, watch) })

			reconciler := setupReconciler(nil)
			_, err := reconciler.Reconcile(ctx, ctrl.Request{
				NamespacedName: types.NamespacedName{Name: watchName, Namespace: watchNamespace},
			})
			Expect(err).NotTo(HaveOccurred())

			cronJob := &batchv1.CronJob{}
			Expect(k8sClient.Get(ctx, types.NamespacedName{
				Name:      "watch-" + watchName,
				Namespace: watchNamespace,
			}, cronJob)).To(Succeed())

			Expect(cronJob.Spec.Schedule).To(Equal("*/30 * * * *"))
			Expect(cronJob.Spec.ConcurrencyPolicy).To(Equal(batchv1.ForbidConcurrent))

			containers := cronJob.Spec.JobTemplate.Spec.Template.Spec.Containers
			Expect(containers).To(HaveLen(1))
			Expect(containers[0].Command).To(ContainElement(testDBID))
		})

		It("patches the CronJob schedule when the Watch spec changes", func() {
			watch := makeWatch()
			Expect(k8sClient.Create(ctx, watch)).To(Succeed())
			DeferCleanup(func() { _ = k8sClient.Delete(ctx, watch) })

			reconciler := setupReconciler(nil)
			_, err := reconciler.Reconcile(ctx, ctrl.Request{
				NamespacedName: types.NamespacedName{Name: watchName, Namespace: watchNamespace},
			})
			Expect(err).NotTo(HaveOccurred())

			// Update the schedule.
			watch.Spec.Schedule = "0 * * * *"
			Expect(k8sClient.Update(ctx, watch)).To(Succeed())

			_, err = reconciler.Reconcile(ctx, ctrl.Request{
				NamespacedName: types.NamespacedName{Name: watchName, Namespace: watchNamespace},
			})
			Expect(err).NotTo(HaveOccurred())

			cronJob := &batchv1.CronJob{}
			Expect(k8sClient.Get(ctx, types.NamespacedName{
				Name:      "watch-" + watchName,
				Namespace: watchNamespace,
			}, cronJob)).To(Succeed())

			Expect(cronJob.Spec.Schedule).To(Equal("0 * * * *"))
		})

		It("mounts secretRef env vars from transport chain and notifiers", func() {
			watch := makeWatch()
			watch.Spec.Transport.Chain = []watcherv1alpha1.TransportEntry{
				{Name: "http"},
				{Name: "flaresolverr", SecretRef: "flaresolverr-creds"},
			}
			Expect(k8sClient.Create(ctx, watch)).To(Succeed())
			DeferCleanup(func() { _ = k8sClient.Delete(ctx, watch) })

			reconciler := setupReconciler(nil)
			_, err := reconciler.Reconcile(ctx, ctrl.Request{
				NamespacedName: types.NamespacedName{Name: watchName, Namespace: watchNamespace},
			})
			Expect(err).NotTo(HaveOccurred())

			cronJob := &batchv1.CronJob{}
			Expect(k8sClient.Get(ctx, types.NamespacedName{
				Name:      "watch-" + watchName,
				Namespace: watchNamespace,
			}, cronJob)).To(Succeed())

			envVarNames := make([]string, 0)
			for _, e := range cronJob.Spec.JobTemplate.Spec.Template.Spec.Containers[0].Env {
				envVarNames = append(envVarNames, e.Name)
			}
			Expect(envVarNames).To(ContainElements("WATCHER_SECRET_FLARESOLVERR_CREDS", "WATCHER_SECRET_TELEGRAM_ALERTS"))
		})
	})

	Context("Status updates", func() {
		It("does not error when DB is nil", func() {
			watch := makeWatch()
			Expect(k8sClient.Create(ctx, watch)).To(Succeed())
			DeferCleanup(func() { _ = k8sClient.Delete(ctx, watch) })

			reconciler := setupReconciler(nil)
			_, err := reconciler.Reconcile(ctx, ctrl.Request{
				NamespacedName: types.NamespacedName{Name: watchName, Namespace: watchNamespace},
			})
			Expect(err).NotTo(HaveOccurred())
		})

		It("does not error when no db-id annotation is set", func() {
			watch := makeWatch()
			watch.Annotations = nil
			Expect(k8sClient.Create(ctx, watch)).To(Succeed())
			DeferCleanup(func() { _ = k8sClient.Delete(ctx, watch) })

			reconciler := setupReconciler(nil)
			_, err := reconciler.Reconcile(ctx, ctrl.Request{
				NamespacedName: types.NamespacedName{Name: watchName, Namespace: watchNamespace},
			})
			Expect(err).NotTo(HaveOccurred())
		})

		It("requeues after 2 minutes", func() {
			watch := makeWatch()
			Expect(k8sClient.Create(ctx, watch)).To(Succeed())
			DeferCleanup(func() { _ = k8sClient.Delete(ctx, watch) })

			reconciler := setupReconciler(nil)
			result, err := reconciler.Reconcile(ctx, ctrl.Request{
				NamespacedName: types.NamespacedName{Name: watchName, Namespace: watchNamespace},
			})
			Expect(err).NotTo(HaveOccurred())
			Expect(result.RequeueAfter).To(Equal(2 * time.Minute))
		})
	})
})
