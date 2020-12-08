import os
import json

# create a json description of all the projects with links and names
# frontend will embed the json and display on the docs page

github = "https://www.github.com/mailslurp/examples/tree/master/"

directories = next(os.walk('.'))[1]
directories = [path for path in directories if "." not in path]

links = list(map(lambda path: { "name": path.replace("-"," ").title(), "url": github + path}, directories))

json_object = json.dumps({ "links": links }, indent = 2)

with open('.manifest.json', 'w+') as output_file:
    output_file.write(json_object)

print("Build complete")
