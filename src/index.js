const AWS = require('aws-sdk')

const usage = `usage: test event must include one type of parameters and an optional dataHandler:
{
  "scanParams": {
    "TableName": "gogo-dash-int-persist-dev-aircraftevents",
    "KeyConditionExpression": "#yr = :yyyy",
    "ExpressionAttributeNames": {
      "#yr": "year"
    },
    "ExpressionAttributeValues": {
      ":yyyy": 1985
    }
  },
  "queryParams": {
    "TableName": "Movies",
    "KeyConditionExpression": "#yr = :yyyy",
    "ExpressionAttributeNames": {
      "#yr": "year"
    },
    "ExpressionAttributeValues": {
      ":yyyy": 1985
    }
  },
  "dataHandler": "data => { console.log(data) }"
}`

const handleData = (data, dataFunc, awsCallback) => {
  if (!!dataFunc) {
    console.log('Executing dataHandler')
    const results = dataFunc(data)
    if (!!results) awsCallback(null, results)
  } else {
    console.log('No dataHandler defined')
  }
}

exports.handler = (event, context, callback) => {
  const { scanParams, queryParams, dataHandler } = event
  let dataFunc

  if (!!dataHandler) {
    dataFunc = eval(dataHandler)
    if (typeof dataFunc !== 'function') {
      callback(
        new Error(
          `"dataHandler" must be null or be a stringified function with the following signature: "data => { ... }"`
        )
      )
      return
    }
  }

  AWS.config.update({
    region: 'us-east-1',
  })

  var docClient = new AWS.DynamoDB.DocumentClient()

  if (!!queryParams) {
    console.log('Executing query')
    docClient.query(queryParams, function (err, data) {
      if (err) {
        let msg = `Unable to query. Error: ${JSON.stringify(err, null, 2)}`
        callback(new Error(msg))
        return
      } else {
        console.log('Query succeeded.')
        handleData(data, dataFunc, callback)
      }
    })
  } else if (!!scanParams) {
    console.log('Executing scan')
    docClient.scan(scanParams, function (err, data) {
      if (err) {
        let msg = `Unable to scan. Error: ${JSON.stringify(err, null, 2)}`
        callback(new Error(msg))
        return
      } else {
        console.log('Scan succeeded.')
        handleData(data, dataFunc, callback)
      }
    })
  } else {
    console.warn(usage)
    callback(new Error(usage))
  }
}
