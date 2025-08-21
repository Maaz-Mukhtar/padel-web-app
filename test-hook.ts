// Test file for pre-commit hook functionality
const testVariable = 'hello world';
console.log(testVariable);

// This should trigger linting and formatting
const badCode = () => {
  return 'not formatted properly';
};

export default badCode;
