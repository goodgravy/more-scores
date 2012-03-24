from django.conf.urls.defaults import patterns, url
from djangorestframework.views import ListOrCreateModelView

from scores import resources

urlpatterns = patterns('scores.views',
	url(r'^$', 'index'),
	url(r'^result$',
		ListOrCreateModelView.as_view(resource=resources.ResultResource)),
	url(r'^result/(?P<pk>[^/]+)/$',
		ListOrCreateModelView.as_view(resource=resources.ResultResource)),
	url(r'^user$',
		ListOrCreateModelView.as_view(resource=resources.UserResource)),
	url(r'^user/(?P<pk>[^/]+)/$',
		ListOrCreateModelView.as_view(resource=resources.UserResource)),
)
