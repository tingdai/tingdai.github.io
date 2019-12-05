#!/usr/bin/python
import jinja2, yaml
from datetime import datetime, date


def datetimeformat(value):
    # return value.strftime(format)
    return datetime.strptime(value, '%Y-%m-%d').strftime('%Y/%m/%d')


templateFilePath = jinja2.FileSystemLoader('./')
jinjaEnv = jinja2.Environment(loader=templateFilePath)

jinjaEnv.filters['datetimeformat'] = datetimeformat

jTemplate = jinjaEnv.get_template("index.html")

with open("_data/conferences.yml") as data:
	data = yaml.load(data)
output = jTemplate.render(conferencesdata=data)
# print output
outFileH = open('index_output.html', 'w')
output = output.encode('ascii', 'ignore')
outFileH.write(output)
outFileH.close()


