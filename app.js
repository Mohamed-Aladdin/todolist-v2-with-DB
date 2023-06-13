const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
// const date = require(`${__dirname}/date.js`);

// console.log(date.getDay);
// console.log(date.getDay());

const app = express();

// const days = ['Sunday', "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI);

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

// const day = date.getDate();

app.get("/", (req, res) => {
  Item.find({}).then((foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems).then(() => {
        console.log("Successfully saved default items to DB");
        res.redirect("/");
      }).catch((err) => {
        console.log(err);
      });
    } else {
        res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  }).catch((err) => {
    console.log(err);
  });
});

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}).then((foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect(`/${listName}`);
    }).catch((err) => {
      console.log(err);
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId).then(() => {
      console.log("Successfully deleted the selected item.");
    }).catch((err) => {
      console.log(err);
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then((foundList) => {
      res.redirect(`/${listName}`);
    }).catch((err) => {
      console.log(err);
    });
  }

});

app.get("/work", (req, res) => {
  res.render("list", {
    listTitle: "Work List",
    newListItems: workItems
  });
});

// app.post("/work", (req, res) => {
//   workItems.push(req.body.newItem);
//   res.redirect("/work");
// });

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}).then((foundList) => {
    if (!foundList) {
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect(`/${customListName}`);
    } else {
      res.render("list", {
        listTitle: customListName,
        newListItems: foundList.items
      });
    }
  }).catch((err) => {
    console.log(err);
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server started on port 3000.");
});
