const request = require('request-promise');
const cheerio = require('cheerio');
const commandLineArgs = require('command-line-args');
const inquirer = require('inquirer');
const webdriver = require('selenium-webdriver');
const { By, until } = webdriver;
const firefox = require('selenium-webdriver/firefox');
const config = require('./config');

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
binary.addArguments('-headless');

const acceptedMimetypes = [
  'application/epub+zip',
  'application/x-mobipocket-ebook',
  'application/octet-stream'
];

const profile = new firefox.Profile();
profile.setPreference('pdfjs.disabled', true);
profile.setPreference('browser.helperApps.neverAsk.saveToDisk', acceptedMimetypes.join(';'));

const firefoxOptions = new firefox.Options()
  .setBinary(binary)
  .setProfile(profile);

const driver = new webdriver.Builder()
  .forBrowser('firefox')
  .setFirefoxOptions(firefoxOptions)
  .build();

async function exit() {
  console.log('K, thanks bye.');
  await driver.quit();
  process.exit();
}

// Fetch book details

async function main() {
  const $ = await request({
    uri: config.urls.freeBooks,
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

    if (!claimInquiry.claim) return exit();
  }

  // Load Packt website

  console.log('Preparing to login. This might take a while...');

  await driver.manage().window().maximize();
  await driver.get(config.urls.freeBooks);

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

  console.log('Logging in...')

  await driver.findElement(By.css('#page #login-form-submit input')).click();

  // For now assume login will always be successful

  console.log('Login successful. Claiming the free ebook...')

  // Claim book / Add Book to library

  await driver.executeScript("document.querySelector('#free-learning-claim').scrollIntoView();");
  await driver.findElement(By.css('#free-learning-claim')).click();

  await driver.wait(async () => {
    const url = await driver.getCurrentUrl();
    return url === config.urls.myBooks;
  }, 5000);

  console.log('Book has been added to your library. Enjoy!');

  // Dowload book in desired format if wanted

  if (options.yes !== true) {
    const downloadInquiry = await inquirer.prompt({
      name: 'download',
      message: 'Do you want to download the Book now?',
      type: 'confirm'
    });

    if (!downloadInquiry) {
      console.log('If you change your mind, you find the book in your librabry: ' + config.urls.myBooks);
      return exit();
    }
  }

  const bookFormat = await inquirer.prompt({
    choices: [
      'ePub',
      'Mobi',
      'PDF'
    ],
    name: 'format',
    message: 'In which format do you want it?',
    type: 'list'
  });

  const { format } = bookFormat;
  console.log(`Downloading book in ${format} format.`);

  await driver.findElement(By.css('.toggle-product-line')).click();
  await driver.sleep(250);
  await driver.findElement(By.css(`div[format=${format.toLowerCase()}]`)).click();

  console.log('Started download. Shutting down in 30s.')

  await driver.sleep(30000);

  console.log('Possibly done. Shutting down.');

  // const data = await driver.takeScreenshot();
  // await writeFile('screenshot.png', data, 'base64');

  await driver.quit();
}

main();
