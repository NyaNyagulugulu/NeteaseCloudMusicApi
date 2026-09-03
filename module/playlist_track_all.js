// 通过传过来的歌单id拿到所有歌曲数据
// 支持传递参数limit来限制获取歌曲的数据数量 例如: /playlist/track/all?id=7044354223&limit=10
// song/detail API 单次请求上限为1000首，分批请求以支持无限制获取

module.exports = (query, request) => {
  const data = {
    id: query.id,
    n: 100000,
    s: query.s || 8,
  }
  let limit = parseInt(query.limit) || Infinity
  let offset = parseInt(query.offset) || 0
  const batchSize = 1000

  return request('POST', `https://music.163.com/api/v6/playlist/detail`, data, {
    crypto: 'api',
    cookie: query.cookie,
    proxy: query.proxy,
    realIP: query.realIP,
  }).then((res) => {
    let trackIds = res.body.playlist.trackIds
    let allSongs = []
    let allPrivileges = []
    let total = trackIds.length
    let remaining = total - offset
    let currentOffset = offset
    let cookie = res.cookie
    let status = 200

    let fetchBatch = () => {
      let batchLimit = Math.min(limit, batchSize, remaining)
      if (batchLimit <= 0) {
        return Promise.resolve()
      }
      let idsData = {
        c:
          '[' +
          trackIds
            .slice(currentOffset, currentOffset + batchLimit)
            .map((item) => '{"id":' + item.id + '}')
            .join(',') +
          ']',
      }
      return request(
        'POST',
        `https://music.163.com/api/v3/song/detail`,
        idsData,
        {
          crypto: 'weapi',
          cookie: query.cookie,
          proxy: query.proxy,
          realIP: query.realIP,
        },
      ).then((res2) => {
        cookie = res2.cookie
        status = res2.status
        allSongs = allSongs.concat(res2.body.songs || [])
        allPrivileges = allPrivileges.concat(res2.body.privileges || [])
        currentOffset += batchLimit
        remaining -= batchLimit
        return fetchBatch()
      })
    }

    return fetchBatch().then(() => {
      return {
        status,
        body: { songs: allSongs, privileges: allPrivileges, code: 200 },
        cookie,
      }
    })
  })
}
