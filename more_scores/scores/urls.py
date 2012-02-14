from django.conf.urls.defaults import patterns, url

urlpatterns = patterns('scores.views',
    url(r'^scores$', 'scores', name='scores.scores'),
    url(r'^results$', 'results', name='scores.results'),
    url(r'^results/user/(?P<username>.+)', 'results'),
)
