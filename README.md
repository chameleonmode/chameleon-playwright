# Chameleon Playwright JS Scripts and Plugins Runner 

## src
 - index.ts for running already open browsers to connect via cli
    - npm run dev:*
 - local.ts for running directly to userdata dir without cdp connection on already open browsers
    - npm run local:*
 - /lib
    - library/utility/inherited funtionality for the rest of the project functions 
 - /scripts
    - each website like reddit for example has a page object containing all the playwright page locators and buisness logic of the plugins
    - /plugins
        - this directory contains all of the seperate plugin/automation functionality based from the page module/object

## tests
 - in progress...