const fs = require("fs");// allows reading and writing
const express = require("express");// importing the express module which simplifies handling HTTP requests and responses.
const path = require("path"); // for file diretory

//Command-line arguments 
if (process.argv.length !== 3) {
    console.log("Usage: node supermarketServer.js <jsonFile>");// checks if the user in the command line writes node file namr to use the functionality if not it stops 
    process.exit(1);
}
const fileName = process.argv[2];// used for the json file 
const portNumber = 5001;

//Item class 
class Item {
    #name;
    #cost;

    constructor(name, cost) {
        this.#name = name;
        this.#cost = cost;
    }

    Info() {
        return { name: this.#name, cost: this.#cost };
    }
}

// Load items from JSON file
const loadItems = (file) => {
    const data = fs.readFileSync(file, "utf-8");// reads the json file 
    const itemsList = JSON.parse(data).itemsList;// Extracts the itemsList array from the JSON data.
    return itemsList.map(item => new Item(item.name, item.cost));//maps the item in the itemsList 
};

const items = loadItems(fileName);// loading the items with the loaditems  method 

//Express app setup
const app = express();
app.set("views", path.join(__dirname, "templates"));
app.set("view engine", "ejs");

//Get Routes
app.get("/", (request, response) => {
    response.render("index"); // route for the home page , renders the index from the index.ejs
});

app.get("/catalog", (request, response) => {
    const itemsTable = items.map(item => //Maps over items to create a table row for each item’s name and cost
        `<tr><td>${item.Info().name}</td><td>${item.Info().cost.toFixed(2)}</td></tr>`
    ).join("");
    response.render("displayItems", { itemsTable: `<table border="1">${itemsTable}</table>` }); //renders displayItems and creates a table of the items using html
});

app.get("/order", (request, response) => {
    const itemsOptions = items.map(item => 
        `<option value="${item.Info().name}">${item.Info().name}</option>`
    ).join("");
    response.render("placeOrder", { items: itemsOptions });// passing it the generated dropdown options as items
});

//Post route
app.post("/order", express.urlencoded({ extended: true }), (request, response) => {
    const { name, email, delivery, itemsSelected } = request.body;
    const selectedItems = items.filter(item => itemsSelected.includes(item.Info().name));
    const totalCost = selectedItems.reduce((sum, item) => sum + item.Info().cost, 0);

    let orderTable = selectedItems.map(item => 
        `<tr><td>${item.Info().name}</td><td>${item.Info().cost.toFixed(2)}</td></tr>`
    ).join("");
    orderTable += `<tr><td><strong>Total</strong></td><td><strong>$${totalCost.toFixed(2)}</strong></td></tr>`;

    response.render("orderConfirmation", {
        name,
        email,
        delivery,
        orderTable: `<table border="1">${orderTable}</table>`
    });
});

//Start the Express server
app.listen(portNumber, () => {
    console.log(`Web server is running at http://localhost:${portNumber}`);
    const prompt = "Type 'itemsList' or 'stop' to control the server: ";
    process.stdout.write(prompt);
});

//Command-line interface intepreter
const prompt = "Type 'itemsList' or 'stop' to control the server: ";
process.stdin.setEncoding("utf8");

process.stdin.on("readable", () => {
    const dataInput = process.stdin.read();
    if (dataInput !== null) {
        const command = dataInput.trim();
        if (command === "stop") {
            console.log("Shutting down the server");
            process.exit(0);//exitting 
        } else if (command === "itemsList") {
            console.log(items.map(item => item.Info()));
        } else {
            /* After invalid command, we cannot type anything else */
            console.log(`Invalid command: ${command}`);
        }
        // Prompt for the next command
        process.stdout.write(prompt);
        process.stdin.resume(); 
    }
});
