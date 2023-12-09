//<gen>firebase-nightwatch-conf
module.exports = {
  src_folders: ["test", "nightwatch"],
  test_settings: {
    default: {
      desiredCapabilities: {
        browserName: "firefox",
      },
      webdriver: {
        start_process: true,
        server_path: "./node_modules/.bin/geckodriver",
      },
    },
  },
};
//</gen>
