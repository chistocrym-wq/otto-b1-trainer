'use strict';
const {defineConfig}=require('@playwright/test');
const executablePath=process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined;
module.exports=defineConfig({
  use:{
    launchOptions:executablePath?{executablePath}:{}
  }
});
