import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";

dotenv.config();
const app = express();
const port = 3000;
let userId = process.env.USER_ID;
let password = process.env.PASSWORD;


const url = 'mongodb://127.0.0.1:27017/blogDB';
// `mongodb+srv://${userId}:${password}@cluster0.5wcf2na.mongodb.net/todolistDB`


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Database setup. 
main().catch(err => console.log(err));
async function main() {
    try {
        await mongoose.connect(url);

        // schema for today list(current day list)
        const listItemSchema = new mongoose.Schema({
            listItem: String
        });

        const TodayList = mongoose.model("todayList", listItemSchema);

        // schema for custom list.
        const listSchema = new mongoose.Schema({
            name: String,
            items: [listItemSchema]
        });
        const List = mongoose.model("List", listSchema);


        // for inserting value through code.
        const item1 = new TodayList({
            listItem: "Maggie"
        });
        const item2 = new TodayList({
            listItem: "Perfume"
        });
        const item3 = new TodayList({
            listItem: "Rice"
        });



        app.get("/", async (req, res) => {
            const listItemToday = await TodayList.find({});
            //this was for inserting data through the code and not repeatedly insert them.
            // if (listItemToday.length === 0) {
            //     try {
            //         const insertMany = await todayList.insertMany([item1, item2, item3]);
            //         console.log("Successfully inserted document into data.");
            //         res.redirect("/");
            //     } catch (error) {
            //         console.log(error);
            //         res.status(404);
            //     }
            // } else {
            res.render("today.ejs", { listTitle: "Today", listItem: listItemToday, allListTitle: await List.find({}), display: "none" })
            // }
        })

        app.get("/create/:customListName", async (req, res) => {
            const customListName = _.startCase(req.params.customListName);
            try {
                const data = await List.findOne({ name: customListName });
                if (!data) {
                    //Create New list.
                    const list = new List({
                        name: customListName,
                        items: []
                    });
                    list.save();
                    res.redirect("/create/" + customListName);
                } else {
                    //Show existing list.
                    res.render("today.ejs", { listTitle: customListName, listItem: data.items, allListTitle: await List.find({}), display: "block" });
                }
            } catch (error) {
                console.log(error)
            }

        });

        app.post("/", async (req, res) => {
            const itemName = req.body.forToday;
            const listName = req.body.list;
            // Creating a new doc.
            const addItem = new TodayList({
                listItem: itemName
            });

            //Checking if the request was made from today or custom heading and then pushing data.
            if (listName === "Today") {
                addItem.save();
                res.redirect("/");
            } else {
                try {
                    const data = await List.findOne({ name: listName })
                    data.items.push(addItem)
                    data.save()
                    res.redirect("/create/" + listName)
                } catch (error) {
                    console.log(error)
                }
            }
        });

        app.post("/create/:customListName", (req, res) => {
            const createList = req.body.createList;
            if (createList) { res.redirect("/create/" + createList) };
        });

        app.post("/deleteItem", async (req, res) => {
            const checkedId = req.body.checkbox;
            const listName = req.body.listTitle;

            if (listName === "Today") {
                try {
                    await TodayList.deleteOne({ _id: checkedId });
                    console.log(`Successfully deleted item from ${listName}.`)
                } catch (error) {
                    console.log("ERROR: " + error.message);
                    res.status(400);
                }
                res.redirect("/")
            } else {
                try {
                    await List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedId } } })
                    console.log(`Successfully deleted item from ${listName}.`);
                    res.redirect("/create/" + listName)
                } catch (error) {
                    console.log(error)
                    res.redirect("/create/" + listName)
                }
            }
        });

        app.post("/deleteList", async (req, res) => {
            const listName = req.body.listName;
            try {
                await List.deleteOne({ name: listName });
                console.log(`Deleted list with name ${listName}.`)
                res.redirect("/")
            } catch (error) {
                console.log(error.message);
                res.status(400);
                res.redirect("/")
            }
        });

    } finally {
        // await mongoose.connection.close();
    }
    // Database curly braces.
}

app.listen(port, () => {
    console.log(`The server is listening at ${port}.`)
})