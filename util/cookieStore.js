const fs = require('fs')
const path = require('path')

const COOKIE_PATH = path.join(__dirname, '../data/cookie.txt')

function parseCookie(str) {
  const obj = {}
  if (!str) return obj
  str.split(';').forEach((pair) => {
    const idx = pair.indexOf('=')
    if (idx < 1) return
    obj[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim()
  })
  return obj
}

function stringifyCookie(obj) {
  return Object.keys(obj)
    .filter((k) => obj[k] != null && obj[k] !== '')
    .map((k) => `${k}=${obj[k]}`)
    .join('; ')
}

function load() {
  try {
    if (fs.existsSync(COOKIE_PATH)) {
      return fs.readFileSync(COOKIE_PATH, 'utf-8').trim()
    }
  } catch (error) {
    console.log('[cookieStore] load failed:', error.message)
  }
  return ''
}

function loadObject() {
  return parseCookie(load())
}

function save(cookieStr) {
  if (!cookieStr || !parseCookie(cookieStr).MUSIC_U) return false
  const dir = path.dirname(COOKIE_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(COOKIE_PATH, cookieStr.trim(), 'utf-8')
  return true
}

function mergeAndSave(updates) {
  const merged = { ...loadObject(), ...parseCookie(updates) }
  if (typeof updates === 'object' && !Array.isArray(updates)) {
    Object.assign(merged, updates)
  }
  if (!merged.MUSIC_U) return false
  return save(stringifyCookie(merged))
}

function saveFromResponse(moduleResponse) {
  if (!moduleResponse) return false
  const bodyCookie = moduleResponse.body && moduleResponse.body.cookie
  if (bodyCookie && parseCookie(bodyCookie).MUSIC_U) {
    return mergeAndSave(bodyCookie)
  }
  if (Array.isArray(moduleResponse.cookie) && moduleResponse.cookie.length) {
    const parts = moduleResponse.cookie.map((item) => item.split(';')[0])
    return mergeAndSave(parts.join('; '))
  }
  return false
}

function hasSavedLogin() {
  return !!loadObject().MUSIC_U
}

module.exports = {
  COOKIE_PATH,
  load,
  loadObject,
  save,
  mergeAndSave,
  saveFromResponse,
  hasSavedLogin,
  parseCookie,
  stringifyCookie,
}
