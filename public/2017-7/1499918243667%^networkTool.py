from django.http import HttpResponse
import json


class NetworkTool():
    def resSuccess(data):
        resObj = {
            'suatus': 200,
            'count': len(data),
            'dataSet': data
        }
        return json.dumps(resObj)