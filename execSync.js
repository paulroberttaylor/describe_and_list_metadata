const fs = require("fs");
const execSync = require("sync-exec");
const xml2js = require("xml2js");

const getDescribe = (username) => {
    const describe = execSync(
        `sfdx force:mdapi:describemetadata -u ${username} --json`
    );
    
    const metadataObjects = JSON.parse(describe.stdout).result.metadataObjects;
    
    let metadataTypeObjects = [];
    
    metadataObjects.forEach(metadataType => {
        metadataTypeObjects.push(metadataType.xmlName);

        if (metadataTypeObjects.childXmlNames) {
            metadataTypeObjects.childXmlNames.forEach(child => {
                metadataTypeObjects.push(child);
            });
        }
    });

    return metadataTypeObjects.sort();
}

const getMetadataArrayByType = (metadataType) => {
    const response = execSync(
        `sfdx force:mdapi:listmetadata -m ${metadataType} -u paulroberttaylor@brave-unicorn-1xlfn6.com --json`
    );
    const stdout = response.stdout;
    const jsonStdout = JSON.parse(stdout);
        
    let metadataObjects = [];

    if(jsonStdout.result) {
        const metadataObjectOrArray = jsonStdout.result;        
        if(metadataObjectOrArray instanceof Array) {
            metadataObjects = [...metadataObjectOrArray];
        }
    }

    return metadataObjects;
}

const getMembersForMetadataObject = (metadataObjects) => {
    let members = [];

    metadataObjects.forEach(item => {
        members.push(item.fullName);
    });
    members.sort();

    return members;
}

let types = [];

getDescribe("paulroberttaylor@brave-unicorn-1xlfn6.com").forEach(metadataType => {

    const metadataObjects = getMetadataArrayByType(metadataType);
    const members = getMembersForMetadataObject(metadataObjects);

    if(members.length > 0) {
        types.push({
            members: members,
            name: metadataType
        });
    }

    console.log(`Conpleted retrieving metadata for ${metadataType}`);
});

const xml = new xml2js.Builder({rootName: "Package", Package: {} }).buildObject({"types": types, "version": "50.0"});
fs.writeFileSync("package.xml", xml, "utf8");