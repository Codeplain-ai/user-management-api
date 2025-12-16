#!/bin/bash

EXEC_DIR="$(pwd)"

# Source environment variables from .env file - look in execution directory
if [ ! -f "$EXEC_DIR/.env" ]; then
    printf "Error: .env file not found in $EXEC_DIR. Please ensure .env file exists with required environment variables.\n"
    exit 69  # EXIT_SERVICE_UNAVAILABLE
fi

set -a  # automatically export all variables
source "$EXEC_DIR/.env"
set +a  # stop automatically exporting

NPM_INSTALL_OUTPUT_FILTER="up to date in|added [0-9]* packages, removed [0-9]* packages, and changed [0-9]* packages in|removed [0-9]* packages, and changed [0-9]* packages in|added [0-9]* packages in|removed [0-9]* packages in"

# ANSI escape code pattern to remove color codes and formatting from output
ANSI_ESCAPE_PATTERN="s/\x1b\[[0-9;]*[mK]//g"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Get the directory from where the script is being executed
EXEC_DIR="$(pwd)"

# Function to check and kill any Node process running on port 8000 (React development server)
check_and_kill_processed_on_port() {
    local port=${1:-8000}  # Default to port 8000 if no port is provided
    # Find process listening on specified port
    local pid=$(lsof -i :$port -t 2>/dev/null)
    if [ ! -z "$pid" ]; then
            printf "Found server running on port $port. Killing it...\n"
            kill -9 "$pid" 2>/dev/null
    fi
}

validate_traffic_on_port() {
    local port=${1:-5433}  # Default to port 5433 if no port is provided
    # if there's no traffic running on the given port, exit with 69
    if ! lsof -i :$port > /dev/null 2>&1; then
        printf "No traffic running on port $port. Exiting...\n"
        exit 69
    fi
}

# Function to get all child processes of a given PID and store them in a list
get_children() {
    local parent_pid=$1
    local children=$(pgrep -P $parent_pid)

    for child in $children
    do
        # Add the child process to the list
        processes_to_kill+=($child)
        # Recursively find the children of the child process
        get_children $child
    done
}

# Cleanup function to ensure all processes are terminated
cleanup() {
    # Kill any running npm processes started by this script
    if [ ! -z "${NPM_PID+x}" ]; then
        pkill -9 -P $NPM_PID > /dev/null 2>&1
        kill -9 $NPM_PID > /dev/null 2>&1
    fi

    # Kill React app and its children if they exist
    if [ ! -z "${API_PID+x}" ]; then
        local processes_to_kill=()
        get_children $API_PID

        # Kill the main process
        kill -9 $API_PID > /dev/null 2>&1

        # Kill all the subprocesses
        for pid in "${processes_to_kill[@]}"
        do
            kill -9 $pid > /dev/null 2>&1
        done

        if [ "${VERBOSE:-}" -eq 1 ] 2>/dev/null; then
            printf "App is terminated!\n"
        fi
    fi

    # Remove temporary files if they exist
    [ -f "$build_output" ] && rm "$build_output" 2>/dev/null
}

# Set up trap to call cleanup function on script exit, interrupt, or termination
trap cleanup EXIT SIGINT SIGTERM

# Check for and kill any existing servers from previous runs
check_and_kill_processed_on_port 8000
validate_traffic_on_port 5433

# Check if build folder name is provided
if [ -z "$1" ]; then
  printf "Error: No build folder name provided.\n"
  printf "Usage: $0 <build_folder_name> <conformance_tests_folder>\n"
  exit 1
fi

# Check if conformance tests folder name is provided
if [ -z "$2" ]; then
  printf "Error: No conformance tests folder name provided.\n"
  printf "Usage: $0 <build_folder_name> <conformance_tests_folder>\n"
  exit 1
fi

if [[ "$3" == "-v" || "$3" == "--verbose" ]]; then
  VERBOSE=1
fi

# Ensures that if any command in the pipeline fails (like npm run build), the entire pipeline
# will return a non-zero status, allowing the if condition to properly catch failures.
set -o pipefail

# Running React application
printf "### Step 1: Starting the API in folder $1...\n"

# Define the path to the subfolder relative to execution directory
NODE_SUBFOLDER="$EXEC_DIR/node_$1"

if [ "${VERBOSE:-}" -eq 1 ] 2>/dev/null; then
  printf "Preparing Node subfolder: $NODE_SUBFOLDER\n"
fi

# Check if the node subfolder exists
if [ -d "$NODE_SUBFOLDER" ]; then
  # Find and delete all files and folders except "node_modules"
  find "$NODE_SUBFOLDER" -mindepth 1 ! -path "$NODE_SUBFOLDER/node_modules*" -exec rm -rf {} +

  if [ "${VERBOSE:-}" -eq 1 ] 2>/dev/null; then
    printf "Cleanup completed, keeping 'node_modules'.\n"
  fi
else
  if [ "${VERBOSE:-}" -eq 1 ] 2>/dev/null; then
    printf "Subfolder does not exist. Creating it...\n"
  fi

  mkdir -p "$NODE_SUBFOLDER"
fi

# Use absolute paths for source directory
cp -R "$EXEC_DIR/$1"/* "$NODE_SUBFOLDER"

# Move to the subfolder
cd "$NODE_SUBFOLDER" 2>/dev/null

if [ $? -ne 0 ]; then
  printf "Error: Node build folder '$NODE_SUBFOLDER' does not exist.\n"
  exit 2
fi

npm install --prefer-offline --no-audit --no-fund --loglevel error | grep -Ev "$NPM_INSTALL_OUTPUT_FILTER"

if [ $? -ne 0 ]; then
  printf "Error: Installing Node modules.\n"
  exit 2
fi

if [ "${VERBOSE:-}" -eq 1 ] 2>/dev/null; then
  printf "Building the application...\n"
fi

build_output=$(mktemp)

npm run build --loglevel silent > "$build_output" 2>&1

if [ $? -ne 0 ]; then
  printf "Error: Building application.\n"
  cat "$build_output"
  rm "$build_output"
  exit 2
fi

rm "$build_output"

if [ "${VERBOSE:-}" -eq 1 ] 2>/dev/null; then
  printf "Starting the application...\n"
fi

npm run dev > app.log 2>&1 &

# Capture the process ID of the npm start command
API_PID=$!
NPM_PID=$(pgrep -P $API_PID npm)

sleep 2


printf "The API is up and running!\n\n"

# Execute all conformance tests in the build folder
printf "### Step 2: Running conformance tests $2...\n"

# Move back to the execution directory
cd "$EXEC_DIR"

# Define the path to the conformance tests subfolder
NODE_CONFORMANCE_TESTS_SUBFOLDER="$EXEC_DIR/node_$2"

if [ "${VERBOSE:-}" -eq 1 ] 2>/dev/null; then
  printf "Preparing conformance tests Node subfolder: $NODE_CONFORMANCE_TESTS_SUBFOLDER\n"
fi

# Check if the conformance tests node subfolder exists
if [ -d "$NODE_CONFORMANCE_TESTS_SUBFOLDER" ]; then
  # Find and delete all files and folders except "node_modules"
  find "$NODE_CONFORMANCE_TESTS_SUBFOLDER" -mindepth 1 ! -path "$NODE_CONFORMANCE_TESTS_SUBFOLDER/node_modules*" -exec rm -rf {} +

  if [ "${VERBOSE:-}" -eq 1 ] 2>/dev/null; then
    printf "Cleanup completed, keeping 'node_modules'.\n"
  fi
else
  if [ "${VERBOSE:-}" -eq 1 ] 2>/dev/null; then
    printf "Subfolder does not exist. Creating it...\n"
  fi

  mkdir -p "$NODE_CONFORMANCE_TESTS_SUBFOLDER"
fi

# Use absolute paths for source directory
cp -R "$EXEC_DIR/$2"/* "$NODE_CONFORMANCE_TESTS_SUBFOLDER"

# Move to the subfolder with tests
cd "$NODE_CONFORMANCE_TESTS_SUBFOLDER" 2>/dev/null

if [ $? -ne 0 ]; then
  printf "Error: conformance tests Node folder '$NODE_CONFORMANCE_TESTS_SUBFOLDER' does not exist.\n"
  exit 2
fi

npm install --prefer-offline --no-audit --no-fund --loglevel error | grep -Ev "$NPM_INSTALL_OUTPUT_FILTER"

if [ $? -ne 0 ]; then
  printf "Error: Installing Node modules for conformance tests failed.\n"
  exit 2
fi

printf "\n#### Running conformance tests...\n"

npm test -- --runInBand --setupFilesAfterEnv="$SCRIPT_DIR/jest.setup.js" --detectOpenHandles --forceExit 2>&1 | sed -E "$ANSI_ESCAPE_PATTERN"
conformance_tests_result=$?

if [ $conformance_tests_result -ne 0 ]; then
  if [ "${VERBOSE:-}" -eq 1 ] 2>/dev/null; then
    printf "Error: Conformance tests have failed.\n"
  fi
  exit 2
fi