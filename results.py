import json

def idToUserId(id):
	return {
		1: "64euselWxZ",
		2: "eqEdn5iSF2",
		3: "SVkywSE3Kh",
		4: "uDwouiu19h",
		5: "27EOOnR20M",
		6: "d7GhhkrFzI",
		8: "jJ0xf7TQ4Z",
		9: "4rQRVA4rXG",
		10: "ZAZZvJBvyJ",
		11: "I1E5ILEKBu",
	}[id]

with open('results.json') as inp:
	for ting in json.load(inp):
		munged = {}

		day, time = ting["played"].split(" ")
		munged["played"] = {
			"__type": "Date",
			"iso": "{d}T{t}.000Z".format(d=day, t=time),
		}

		try:
			for index, winner in enumerate(ting["winners"]):
				munged["winner"+str(index)] = {
					"__type": "Pointer",
					"className": "_User",
					"objectId": idToUserId(winner["id"]),
			}
			for index, loser in enumerate(ting["losers"]):
				munged["loser"+str(index)] = {
					"__type": "Pointer",
					"className": "_User",
					"objectId": idToUserId(loser["id"]),
				}
		except KeyError:
			print winner
			print loser
			raise

		print """
curl -X POST   -H "X-Parse-Application-Id: LwvhP24g9g3LRFRWohv2n5kMfpyp7My7Nbj0P4ah"   -H "X-Parse-REST-API-Key: 7E77gMuTAjNMxhlJBB2K48ePDoNhRyYvQLmEvBrB"   -H "Content-Type: application/json"   -d '{ting}'   https://api.parse.com/1/classes/Result
""".format(ting=json.dumps(munged))

