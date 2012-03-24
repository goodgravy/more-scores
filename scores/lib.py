from functools import wraps
import json
import logging
import sys
import traceback

from django.http import Http404, HttpResponse

LOG = logging.getLogger(__name__)

def _response_to_dict(response):
	'''Serialize as nicely as possible a function's result to a dictionary.
	
	:param response: whatever the function returns
	:returns: tuple of (``dict``, ``status_code``)
	'''
	dict_response = {}
	status = 200
	if isinstance(response, HttpResponse):
		# some very strange case (e.g. 405): still return JSON!
		dict_response = {'text': response.content}
		status = response.status_code
	else:
		if not isinstance(response, dict):
			LOG.critical('%s is not a dictionary!' % response)
			dict_response = {'text': str(response)}
		else:
			# ensure we don't mutate the dictionary
			dict_response = dict(response)
	return dict_response, status

def json_view(thing):
	'''Ensure a Django view returns JSON.
	
	:param thing: the function being wrapped
	'''
	@wraps(thing)
		
	def wrap(request, *args, **kw):
		'Call the method, process the output'
		response = None
		status = 200
		try:
			response, status = _response_to_dict(thing(request, *args, **kw))
		except KeyboardInterrupt:
			# Allow keyboard interrupts through for debugging.
			raise
		except Http404, exc:
			response = {'result': 'error', 'text': str(exc)}
			status = 404
		except Exception, exc:
			exc_info = sys.exc_info()
			try:
				request_repr = repr(request)
			except Exception:
				request_repr = 'Request repr() unavailable'
			subject = 'JSON view error: %s' % request.path
			message = 'Traceback:\n%s\n\nRequest:\n%s' % (
				''.join(traceback.format_exception(*exc_info)),
				request_repr,
			)
			LOG.error(message)

			# Come what may, we're returning JSON.
			if hasattr(exc, 'messages') and exc.messages:
				msg = '\n'.join(exc.messages)
			elif hasattr(exc, 'message') and exc.message:
				msg = exc.message
			else:
				msg = _('Internal error')+': '+str(exc)
			response = {'result': 'error', 'text': msg}
			status = 500
			
		if 'result' not in response:
			response['result'] = 'ok' if status <= 399 else 'error'
		json_output = json.dumps(response, indent=4)
		return HttpResponse(json_output, status=status, mimetype='application/json')
	return wrap
