# create a json description of all the projects with links and names
# frontend will embed the json and display on the docs page

import os
import json


# covert example directory into a line item
def example_item(path):
    return {"name": path.replace("-", " ").title(), "url": github + path, "directory": path, "language": path.split("-")[0]}


# get a list of directories in the example project
manifest_path = os.environ["MANIFEST_PATH"]
github = "https://www.github.com/mailslurp/examples/tree/master/"
directories = next(os.walk(os.environ["ROOT"]))[1]
directories = [path for path in directories if "." not in path and "node_modules" not in path and "shortcodes" not in path]

# map each directory and save the json
links = list(map(example_item, directories))
json_object = json.dumps({"links": links}, indent=2)
with open(manifest_path, 'w+') as output_file:
    output_file.write(json_object)

print(f'Build complete. {manifest_path} file written')
