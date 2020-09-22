const MONGODB = process.env.MONGODB || 'mongodb://localhost:27017/test'

const assert = require('assert')
const Mongolass = require('..')
const Collection = Mongolass.Collection
const Model = Mongolass.Model
const mongolass = new Mongolass(MONGODB)

describe('model.js', function () {
  beforeEach(async function () {
    await mongolass.model('User').insertOne({ name: 'aaa', age: 2 })
    await mongolass.model('User').insertOne({ name: 'bbb', age: 1 })
  })

  afterEach(async function () {
    await mongolass.model('User').deleteMany()
  })

  after(async function () {
    await mongolass.disconnect()
  })

  it('connect', async function () {
    const coll = await mongolass.model('User').connect()
    assert.ok(coll instanceof Collection)

    const coll2 = await mongolass.model('User').connect()
    assert.ok(coll2 instanceof Collection)
    assert.ok(coll === coll2)
  })

  it('model', async function () {
    const User = mongolass.model('User')
    const User2 = mongolass.model('User').model('User')
    const User3 = mongolass.model('User').model('notExist').model('User')
    assert.ok(User instanceof Model)
    assert.ok(User === User2)
    assert.ok(User === User3)
  })

  it('plugin', async function () {
    let error
    const User = mongolass.model('User')
    try {
      User.plugin('filter', function (result, key) {
        return result.map(function (item) {
          return item[key]
        })
      })
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(error.message, 'Wrong plugin name or hooks')

    User.plugin('descSortAndToUpper', {
      beforeFind: function (key) {
        const opt = { sort: {} }
        opt.sort[key] = -1
        if (this._args.length === 0) {
          this._args.push({}, opt)
        } else if (this._args.length === 1) {
          this._args.push(opt)
        }
      },
      afterFind: function (result, key) {
        return result.map(function (item) {
          return item[key].toUpperCase()
        })
      }
    })
    const usernames = await User.find().descSortAndToUpper('name')
    assert.deepStrictEqual(usernames, ['BBB', 'AAA'])
  })
})
