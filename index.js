const puppeteer = require('puppeteer');
const fs = require('fs');
const config = require('./config.json');
const cookies = require('./cookies.json');
var data = require('./data/data.json');

try {
  var remember_position = require('./data/logs.json'); // try get logs
} catch (err) {
  console.log(err);
}

if (typeof remember_position !== 'undefined') {
	console.log('Remember position at: ', remember_position["index"])
	data = data.slice(remember_position["index"]); // update data if logs exists
}

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
				try {
					// danhmuc1
					await page.waitForSelector('#id_list');
					const danhmuc1_optionWanted = (await page.$x(`//*[@id = "id_list"]/option[text() = "${data[i].danhmuc1}"]`))[0];
					const danhmuc1_opionValue = await (await danhmuc1_optionWanted.getProperty('value')).jsonValue();
					await page.select('#id_list', danhmuc1_opionValue);
				} catch (err) {
					console.log('danhmuc1: ', err.message);
				}
				// danhmuc2
				try {
					await page.waitForSelector('#id_cat option:nth-child(2)');
					const danhmuc2_optionWanted = (await page.$x(`//*[@id = "id_cat"]/option[text() = "${data[i].danhmuc2}"]`))[0];
					const danhmuc2_opionValue = await (await danhmuc2_optionWanted.getProperty('value')).jsonValue();
					await page.select('#id_cat', danhmuc2_opionValue);
				} catch (err) {
					console.log('danhmuc2: ', err.message);
				}
				// danhmuc3
				try {
					await page.waitForSelector('#id_item option:nth-child(2)');
					const danhmuc3_optionWanted = (await page.$x(`//*[@id = "id_item"]/option[text() = "${data[i].danhmuc3}"]`))[0];
					const danhmuc3_opionValue = await (await danhmuc3_optionWanted.getProperty('value')).jsonValue();
					await page.select('#id_item', danhmuc3_opionValue);
				} catch (err) {
					console.log('danhmuc3: ', err.message);
				}

				// uploading image
				let multiple_files = []
				for ( var index = 0; index < data[i].tonganh; index++){
          if (index == 0) {
					  const uploadElement = await page.$("#file");
						await uploadElement.uploadFile('./images/' + data[i].masp + '.jpg');
					} else {
						// upload more
						if (index < data[i].tonganh) {
							multiple_files.push(( './images/' + data[i].masp + '_' + index + '.jpg'));
						}

						if (index == data[i].tonganh - 1) {
							const uploadMultiple = await page.$('[name="files[]"]');
							await uploadMultiple.uploadFile(...(multiple_files.reverse()));
						}
					}
				}

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

				/* remember position */
				let logs_index = i+1;
				if (typeof remember_position !== 'undefined') {
					remember_position["index"] = remember_position["index"] + i+1;
					logs_index = remember_position["index"];
				}

				console.log('logs_index = ', logs_index);
				let logs = JSON.stringify({"index": logs_index});
				fs.writeFileSync("data/logs.json", logs);
				/* ===> end remember postion */

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
		await page.waitForSelector('#username');
		await page.type('#username', config.username, { delay: 30 });
		await page.waitForSelector('#pass');
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
