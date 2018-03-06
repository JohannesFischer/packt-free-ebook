const request = require('request-promise');
const cheerio = require('cheerio');
const commandLineArgs = require('command-line-args');
const inquirer = require('inquirer');
const webdriver = require('selenium-webdriver');
const { By, until } = webdriver;
const firefox = require('selenium-webdriver/firefox');

const optionDefinitions = [
  { name: 'yes', alias: 'y', type: Boolean },
  { name: 'email', type: String }
];

const options = commandLineArgs(optionDefinitions);

// For screenshots only
const util = require('util');
const fs = require('fs');
const writeFile = util.promisify(fs.writeFile);

const binary = new firefox.Binary(firefox.Channel.Release);
// binary.addArguments('-headless');

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

  console.log('The current free ebook is: ' + bookTitle);

  // Prompt to claim the book

  if (options.yes !== true) {
    const claimInquiry = await inquirer.prompt({
      name: 'claim',
      message: 'Interested?',
      type: 'confirm'
    });

    if (!claimInquiry.claim) {
      console.log('K, thanks bye.');
      await driver.quit();
      process.exit();
    }
  }

  // Load Packt website

  console.log('Preparing to login. This might take a while...');

  await driver.manage().window().maximize();
  await driver.get(freeBookUrl);

  // Login

  await driver.executeScript("document.querySelector('#account-bar-login-register .login-popup').click();");
  await driver.sleep(400);

  const questions = [
    {
      default: options.email || '',
      name: 'email',
      message: 'Email address',
      type: 'input'
    },
    {
      name: 'password',
      message: 'Password',
      type: 'password'
    }
  ];

  const { email, password } = await inquirer.prompt(questions)

  await driver.findElement(By.css('body')).sendKeys(webdriver.Key.TAB);
  await driver.findElement(By.css('#page input#email')).sendKeys(email);
  await driver.findElement(By.css('#page input#password')).sendKeys(password);
  await driver.findElement(By.css('#page #login-form-submit input')).click();

  // For now assume login will always be successful

  console.log('Login successful. Claiming the free ebook...')

  // Claim book / Add Book to library

  await driver.executeScript("document.querySelector('#free-learning-claim').scrollIntoView();");
  await driver.findElement(By.css('#free-learning-claim')).click();

  await driver.sleep(1500);

  console.log('Book has been added to your library. Enjoy!');

  const data = await driver.takeScreenshot();
  await writeFile('screenshot.png', data, 'base64');

  await driver.quit();
}

main();

// What's next?

// Dowload book in desired format if wanted

// Bonus point two: check for duplicates for automated use
