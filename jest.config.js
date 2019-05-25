module.exports = {
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.(t|j)s?$": "ts-jest"
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(js?|ts?)$",
  moduleFileExtensions: ["ts", "js", "json"]
};
