const puppeteer = require('puppeteer');
const fs = require('fs');
const config = require('./config.json');
const cookies = require('./cookies.json');
const data = require('./data/data.json');


(async () => {
	/* Start up puppeteer and create a new page */
	let browser = await puppeteer.launch({ headless: false });
	let page = await browser.newPage();
	await page.setViewport({ width: 1366, height: 768});

	/* check if we have a previously saved session */
	if(Object.keys(cookies).length) {
		console.log('has cookie')

		/* Set the saved cookies in the puppeteer browser page */
		await page.setCookie(...cookies);

		/* Go to machungdung.com */
		await page.goto('https://machungdung.com/admin/index.php?com=product&act=add&type=product', { waitUntil: 'networkidle2' });
		
		(async function() {
			for ( var i = 0; i < data.length; i++){
				/* filling form */

				// select first category
				// try {
				const optionWanted = (await page.$x(`//*[@id = "id_list"]/option[text() = "${data[i].danhmuc}"]`))[0];
				const opionValue = await (await optionWanted.getProperty('value')).jsonValue();
				await page.select('#id_list', opionValue);
				// } catch (err) {
				// 	console.log(err.message);
				// }

				// uploading image
				const uploadElement = await page.$("#file");
				await uploadElement.uploadFile('./images/' + data[i].masp + '.jpg');

				await page.type('#masp', data[i].masp, { delay: 30 });
				await page.type('#giaban', data[i].giaban, { delay: 30 });
				await page.type('#soluong', data[i].soluong, { delay: 30 });
				// await page.click('#check1'); // uncomment to hide product
				await page.type('#ten_vi', data[i].name, { delay: 30 });
				await page.type('[name="mota_vi"]', data[i].mota, { delay: 30 });

				// update content description
				const elementHandle = await page.$('.cke_wysiwyg_frame');
        const frame = await elementHandle.contentFrame();
				// await frame.type('.cke_editable', data[i].noidung, { delay: 30 });
				await frame.waitForSelector('.cke_editable');
				await frame.$eval('.cke_editable', (el, value) => el.innerHTML = value, data[i].noidung);

				await page.type('[name="title"]', data[i].name, { delay: 30 });
				await page.type('[name="keywords"]', data[i].name, { delay: 30 });
				await page.type('[name="description"]', data[i].name, { delay: 30 });

				/* click the create button */
		    await page.click('.blueB');

				/* Wait for navigation to finish */
		    await page.waitForNavigation({ waitUntil: 'networkidle2' });
				await page.waitFor(15000);
				await page.goto('https://machungdung.com/admin/index.php?com=product&act=add&type=product', { waitUntil: 'networkidle2' });
			}
	  })();

	} else {
		console.log('no cookie')

		/* Go to the machungdung.com */
		await page.goto('https://machungdung.com/admin/index.php?com=user&act=login', { waitUntil: 'networkidle0' });

		/* Write in the username and password */
		await page.type('#username', config.username, { delay: 30 });
		await page.type('#pass', config.password, { delay: 30 });

		/* click the login button */
		await page.click('.logMeIn');

		/* Wait for navigation to finish */
		await page.waitForNavigation({ waitUntil: 'networkidle0' });
		// await page.waitFor(15000);

		/* Check if logged in */
		try {
			await page.waitForSelector('.welcome');
		} catch(error) {
			console.log('Failed to login.');
			process.exit(0);
		}

		/* Get the current browser page session */
		let currentCookies = await page.cookies();
		console.log(currentCookies);

		/* Create a cookie file if not already created to hold the session */
		fs.writeFileSync('./cookies.json', JSON.stringify(currentCookies));

	}


    debugger;

})();
