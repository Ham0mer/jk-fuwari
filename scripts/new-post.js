/* This is a script to create a new post markdown file with front-matter */

import fs from "fs"
import path from "path"

function getDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  const hours = String(today.getHours()).padStart(2, "0")
  const minutes = String(today.getMinutes()).padStart(2, "0")
  const seconds = String(today.getSeconds()).padStart(2, "0")

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

const args = process.argv.slice(2)

if (args.length === 0) {
  console.error(`Error: No filename argument provided
Usage: npm run new-post -- <filename>`)
  process.exit(1) // Terminate the script and return error code 1
}

let fileName = args[0]
const hasImgFlag = args.includes("img")

// Add .md extension if not present
const fileExtensionRegex = /\.(md|mdx)$/i
if (!fileExtensionRegex.test(fileName)) {
  fileName += ".md"
}

const targetDir = "./src/content/posts/"
const fullPath = path.join(targetDir, fileName)

if (fs.existsSync(fullPath)) {
  console.error(`Error: File ${fullPath} already exists `)
  process.exit(1)
}

// recursive mode creates multi-level directories
const dirPath = path.dirname(fullPath)
if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
}

const postBaseName = path.basename(fileName, path.extname(fileName))
if (hasImgFlag) {
  let imgDirName = postBaseName
  if (postBaseName.toLowerCase() === "index") {
    imgDirName = path.basename(path.dirname(fullPath))
  }
  const imgDirPath = path.join("public", "IMG", imgDirName)
  if (!fs.existsSync(imgDirPath)) {
    fs.mkdirSync(imgDirPath, { recursive: true })
    console.log(`Image folder ${imgDirPath} created`)
  } else {
    console.log(`Image folder ${imgDirPath} already exists`)
  }
}

const content = `---
title: ${postBaseName}
published: ${getDate()}
description: ''
image: ''
pinned: false
tags: []
category: ''
draft: false 
lang: 'zh-CN'
---
`

fs.writeFileSync(fullPath, content)

console.log(`Post ${fullPath} created`)
