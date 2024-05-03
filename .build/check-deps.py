import os
import subprocess
import re

# Initialize an empty list to store folders with outdated dependencies
error_array = []

# Read .githubactionsignore file
with open('.githubactionsignore', 'r') as f:
    ignore_list = f.read().splitlines()

# Iterate over the items in the root directory
for item in os.listdir('.'):
    # Ignore files and directories in .githubactionsignore
    if item in ignore_list:
        continue

    # Ignore non-directory items
    if not os.path.isdir(item):
        continue

    # Split the folder name on _ or -
    parts = re.split('_|-', item)

    # Check if the first part starts with 'js' or 'javascript'
    if parts[0].lower().startswith(('js', 'javascript')):
        # Change into the directory
        os.chdir(item)

        # Run 'npm outdated' and capture the output
        result = subprocess.run(['npm', 'outdated'], capture_output=True, text=True)

        # If there are outdated dependencies, add the folder to the error array
        if result.stdout:
            error_array.append(item)

        # Change back to the root directory
        os.chdir('..')

# If the error array is not empty, print the folders and exit with code 1
if error_array:
    print("The following folders have outdated dependencies:")
    for folder in error_array:
        print(folder)
    exit(1)
else:
    print("All good")
    exit(0)