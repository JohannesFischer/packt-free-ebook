const request = require('request-promise');
const cheerio = require('cheerio');
const inquirer = require('inquirer');
const webdriver = require('selenium-webdriver');
const { By, until } = webdriver;
const firefox = require('selenium-webdriver/firefox');

// For screenshots only
const util = require('util');
const fs = require('fs');
const writeFile = util.promisify(fs.writeFile);

const binary = new firefox.Binary(firefox.Channel.Release);
// binary.addArguments('-headless');
// binary.addArguments('--window-size=1100,600');

const driver = new webdriver.Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(new firefox.Options().setBinary(binary))
    .build();

const freeBookUrl = 'https://www.packtpub.com//packt/offers/free-learning';

// Fetch book details

async function main() {
  const $ = await request({
    uri: freeBookUrl,
    transform: function (body) {
      return cheerio.load(body);
    }
  });

  const bookTitle = $('#deal-of-the-day h2').text().trim();

  console.log('The current free ebook is: ', bookTitle);

  // Prompt to claim the book

  const claimInquiry = await inquirer.prompt({
    name: 'claim',
    message: 'Interested?',
    type: 'confirm'
  });

  if (!claimInquiry.claim) {
    console.log('K, thanks bye.');
    process.exit();
  }

  // Load Packt website
  console.log('Preparing to login...');

  await driver.get(freeBookUrl);

  await driver.sleep(1000);

  await driver.executeScript("document.querySelector('#account-bar-login-register .login-popup').scrollIntoView(true);");

  const data = await driver.takeScreenshot();
  await writeFile('screenshot.png', data, 'base64');

  const loginToggle = await driver.findElement(By.css('#account-bar-login-register .login-popup'));

  await loginToggle.click;

  await driver.sleep(5000);
  await driver.quit();
  //       driver.get(freeBookUrl).then(() => {
  //         driver.takeScreenshot();
  //         const questions = [
  //           {
  //             name: 'email',
  //             message: 'Email address',
  //             type: 'input'
  //           },
  //           {
  //             name: 'password',
  //             message: 'Password',
  //             type: 'password'
  //           }
  //         ];

  //         inquirer.prompt(questions).then(answers => {
  //           console.log(answers);

  //           driver.findElement(By.css('#account-bar-login-register .login-popup')).then(login => {
  //             login.click();
  //           });
  //         });
  //       });
  //     });
  //   }
  // });
}

main();

// What's next?

// Login and follow redirect to free ebook page

// Claim book / Add Book to library

// Dowload book in desired format if wanted

// Bonus point one: add command line options

// Bonus point two: check for duplicates for automated use

// driver.quit();
