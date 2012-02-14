import json

from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.template import RequestContext

from scores import models

def scores(request):
	return render_to_response('scores.html', {}, context_instance=RequestContext(request))

def results(request, username=None):
	points_changes = models.PointsChange.objects
	if username is not None:
		points_changes = points_changes.filter(user=models.User.objects.get(username=username))
	points_changes = points_changes.all()

	response = []

	for points_change in points_changes:
		response.append({
			"played": points_change.result.played.isoformat(),
			"username": points_change.user.username,
			"name": points_change.user.first_name,
			"points": points_change.points,
		})

	
	mimetype = 'application/javascript'
	# data = serializers.serialize('json', response)
	return HttpResponse(json.dumps(response), mimetype)
