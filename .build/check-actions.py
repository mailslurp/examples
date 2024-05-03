import os
import yaml

# Load .githubactionsignore
with open('.githubactionsignore', 'r') as f:
    ignore_dirs = f.read().splitlines()

# Get all directories in the root
all_dirs = [d for d in os.listdir('.') if os.path.isdir(d) and d not in ignore_dirs]

# Load workflow file
with open('.github/workflows/main.yml', 'r') as f:
    workflow = yaml.safe_load(f)

# Get directories in the matrix
matrix_dirs = workflow['jobs']['test']['strategy']['matrix']['directory']

# Check if all directories are in the matrix
missing_dirs = [d for d in all_dirs if d not in matrix_dirs]

if missing_dirs:
    print(f"Missing directories in the matrix: {'\n'.join(missing_dirs)}")
    exit(1)