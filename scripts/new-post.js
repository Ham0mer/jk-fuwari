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

// Normalize: remove .md/.mdx extension and trailing /index
const fileExtensionRegex = /\.(md|mdx)$/i
fileName = fileName.replace(fileExtensionRegex, "")
fileName = fileName.replace(/\/index$/i, "")

const postDirName = fileName
const targetDir = "./src/content/posts/"
const fullPath = path.join(targetDir, postDirName, "index.md")

if (fs.existsSync(fullPath)) {
  console.error(`Error: File ${fullPath} already exists `)
  process.exit(1)
}

fs.mkdirSync(path.dirname(fullPath), { recursive: true })

const content = `---
title: ${postDirName}
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