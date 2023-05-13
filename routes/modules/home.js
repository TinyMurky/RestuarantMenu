const express = require("express")
const router = express.Router()

const Restaurant = require("../../models/restaurant")

// config for res.render of each routes
const setting = {
  index: {
    title: "我的餐廳",
    stylesheet: "index.css",
    restaurantList: null,
    sortRules: ["A->Z", "Z->A", "類別", "地區"],
    sortKeyword: null,
    errorMessage: null,
  },
}
//home page render
const sortBy = require("../../plugins/sortBy").sortBy
router.get("/", (req, res) => {
  const sortBaseOn = sortBy(setting, req.query.sort) //this function pass an object base on rule to sort restaurants
  return Restaurant.find()
    .sort(sortBaseOn)
    .lean()
    .then((restaurants) => {
      if (restaurants && restaurants.length) {
        setting.index.errorMessage = null //reset error message if any restaurant exist
        return (setting.index.restaurantList = restaurants)
      } else {
        throw new Error(
          "Looks like we didn't have any restaurant on our website :("
        )
      }
    })
    .then(() => res.status(200).render("index", setting.index))
    .catch((error) => {
      setting.index.errorMessage = error.message //render error message to client
      res.status(200).render("emptySearch", setting.index) //send error to server
      console.error(error)
    })
})

//搜尋功能
router.get("/search", (req, res) => {
  const keyword = String(req.query.keyword).trim()
  const sortBaseOn = sortBy(setting, req.query.sort)
  const searchSetting = { ...setting.index } //make a copy of setting pervent pollue
  Restaurant.find({
    $or: [
      // search by case insensitive
      { name: { $regex: `${keyword}`, $options: "i" } },
      { name_en: { $regex: `${keyword}`, $options: "i" } },
      { category: { $regex: `${keyword}`, $options: "i" } },
    ],
  })
    .sort(sortBaseOn)
    .lean()
    .then((searchResults) => {
      searchSetting.keyword = keyword
      searchSetting.restaurantList = searchResults
      if (searchResults.length) {
        res.status(200).render("index", searchSetting)
      } else {
        throw new Error("Wow! Such Empty!")
      }
    })
    .catch((error) => {
      searchSetting.errorMessage = error.message
      res.status(200).render("emptySearch", searchSetting)
      console.error(error)
    })
})

module.exports = router
