from django import forms

from scores import models

class TeamField(forms.CharField):
	def to_python(self, value):
		users = [models.User.objects.get(pk=user.get('id')) for user in value]
		for team in users[0].team_set.all():
			if [user for user in team.users.all()] == users:
				return team
		else:
			raise forms.ValidationError( 
				"No matching team found for {value}".format(value=value)
			)

class ResultForm(forms.ModelForm):
	class Meta:
		model = models.Result
	
	winners = TeamField()
	losers = TeamField()
