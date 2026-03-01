package v1alpha1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// WatchSpec defines the desired state of Watch.
type WatchSpec struct {
	// URL to scrape.
	// +kubebuilder:validation:Required
	URL string `json:"url"`

	// Adapter name to use for parsing listings.
	// +kubebuilder:validation:Required
	// +kubebuilder:validation:Enum=facebook;gumtree;generic-html
	Adapter string `json:"adapter"`

	// Transport is the ordered list of transports to try.
	// +kubebuilder:validation:Required
	Transport TransportChainConfig `json:"transport"`

	// Schedule is a cron expression for scrape frequency e.g. "*/30 * * * *".
	// +kubebuilder:validation:Required
	Schedule string `json:"schedule"`

	// Notifiers defines notification channels.
	// +kubebuilder:validation:Required
	// +kubebuilder:validation:MinItems=1
	Notifiers []NotifierEntry `json:"notifiers"`

	// Filters restricts which listings are stored.
	// +optional
	Filters WatchFilters `json:"filters,omitempty"`

	// LLMQuestions are optional prompts for visual analysis of listing images.
	// +optional
	LLMQuestions []string `json:"llmQuestions,omitempty"`

	// SimilarityThreshold is the cosine similarity threshold for image dedup (0–1).
	// +kubebuilder:default=0.85
	// +kubebuilder:validation:Minimum=0
	// +kubebuilder:validation:Maximum=1
	// +optional
	SimilarityThreshold float64 `json:"similarityThreshold,omitempty"`

	// Enabled controls whether this watch is active.
	// +kubebuilder:default=true
	// +optional
	Enabled bool `json:"enabled,omitempty"`
}

// TransportChainConfig is an ordered list of transports to attempt in sequence.
type TransportChainConfig struct {
	// Chain is the ordered list of transport entries.
	// +kubebuilder:validation:MinItems=1
	Chain []TransportEntry `json:"chain"`
}

// TransportEntry configures a single transport in the chain.
type TransportEntry struct {
	// Name identifies the transport implementation.
	// +kubebuilder:validation:Enum=http;playwright;flaresolverr;brightdata
	Name string `json:"name"`

	// SecretRef is an optional Kubernetes Secret name containing transport credentials.
	// +optional
	SecretRef string `json:"secretRef,omitempty"`
}

// NotifierEntry configures a notification channel.
type NotifierEntry struct {
	// Type is the notification provider.
	// +kubebuilder:validation:Enum=ntfy;telegram;slack
	Type string `json:"type"`

	// SecretRef is the Kubernetes Secret containing provider credentials.
	SecretRef string `json:"secretRef"`
}

// WatchFilters restricts which scraped listings are stored or surfaced.
type WatchFilters struct {
	// PriceMin is the minimum listing price to include.
	// +optional
	PriceMin *float64 `json:"priceMin,omitempty"`

	// PriceMax is the maximum listing price to include.
	// +optional
	PriceMax *float64 `json:"priceMax,omitempty"`

	// Keywords filters listings by title/description text.
	// +optional
	Keywords KeywordFilters `json:"keywords,omitempty"`
}

// KeywordFilters allows include/exclude keyword matching on listing text.
type KeywordFilters struct {
	// Include requires at least one keyword to be present in the listing.
	// +optional
	Include []string `json:"include,omitempty"`

	// Exclude rejects listings that contain any of these keywords.
	// +optional
	Exclude []string `json:"exclude,omitempty"`
}

// WatchStatus defines the observed state of Watch.
// +kubebuilder:subresource:status
type WatchStatus struct {
	// LastRunTime is the timestamp of the most recently completed pipeline run.
	// +optional
	LastRunTime *metav1.Time `json:"lastRunTime,omitempty"`

	// LastRunStatus is the outcome of the most recent run.
	// +kubebuilder:validation:Enum=Success;Failed;Running;Unknown
	// +optional
	LastRunStatus string `json:"lastRunStatus,omitempty"`

	// ListingsFound is the total number of listings scraped in the last run.
	// +optional
	ListingsFound int `json:"listingsFound,omitempty"`

	// NewListings is the number of previously-unseen listings in the last run.
	// +optional
	NewListings int `json:"newListings,omitempty"`

	// TransportUsed is the transport that successfully returned content in the last run.
	// +optional
	TransportUsed string `json:"transportUsed,omitempty"`

	// Conditions represents the latest available observations of the Watch's state.
	// +listType=map
	// +listMapKey=type
	// +optional
	Conditions []metav1.Condition `json:"conditions,omitempty"`
}

// Watch is the Schema for the watches API.
//
// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:resource:scope=Namespaced,shortName=w
// +kubebuilder:printcolumn:name="Adapter",type=string,JSONPath=`.spec.adapter`
// +kubebuilder:printcolumn:name="Schedule",type=string,JSONPath=`.spec.schedule`
// +kubebuilder:printcolumn:name="Last Status",type=string,JSONPath=`.status.lastRunStatus`
// +kubebuilder:printcolumn:name="New Listings",type=integer,JSONPath=`.status.newListings`
// +kubebuilder:printcolumn:name="Last Run",type=date,JSONPath=`.status.lastRunTime`
type Watch struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   WatchSpec   `json:"spec,omitempty"`
	Status WatchStatus `json:"status,omitempty"`
}

// WatchList contains a list of Watch.
// +kubebuilder:object:root=true
type WatchList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Watch `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Watch{}, &WatchList{})
}
