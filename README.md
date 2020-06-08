# You made me do this, Bezos.

## Usage
Create a test event in the AWS console with either a `queryParams` or a `scanParams` field containing the AWS parameters to feed into the query or scan operation. If both fields exist, the query will be used and the scan will be ignored.

Optionally, a `dataHandler` field may also be defined in the test event. The value of this field must be a stringified javascript function that takes a single `data` parameter (because this is a JSON string, it must fit on a single line). If the scan or query succeeds, the results will be passed into the `dataHandler` function. If the `dataHandler` function returns any results, they will be returned in the lambda response.

The default `dataHandler` simply returns the results of the DynamoDB operation.

### Example:
```json
{
  "queryParams": {
    "TableName": "gogo-dash-int-persist-dev-aircraftevents",
    "KeyConditionExpression": "#P = :pvalue AND begins_with(#S, :svalue)",
    "FilterExpression": "attribute_exists(CONSOLE)",
    "ExpressionAttributeNames": {
      "#P": "aircraftSID",
      "#S": "eventKey"
    },
    "ExpressionAttributeValues": {
      ":pvalue": "001F0000010HrN5IAK:a01F000000F2UBPIA3",
      ":svalue": "15913"
    }
  },
  "dataHandler": "data => {return data.Items.reduce((acc, item) => {if (item.CONSOLE.flight_state === 'ABOVE_SERVICE_ALTITUDE') {acc.ASA++} else {acc.BSA++}return acc},{ ASA: 0, BSA: 0 })}"
}
```

This sample test event will query the `gogo-dash-int-persist-dev-aircraftevents` table for records with 
- A `partition key` matching `001F0000010HrN5IAK:a01F000000F2UBPIA3`
- A `sort key` beginning with `15913` 
- A defined `CONSOLE` field

If matching records are found, the `dataHandler` function will count and return the number of records whose `CONSOLE.flight_state` is or is not `ABOVE_SERVICE_ALTITUDE`, e.g. ```{ "ASA": 26, "BSA": 5 }```

Here is the same `dataHandler` before flattening:

```js
data => {
  return data.Items.reduce(
    (acc, item) => {
      if (item.CONSOLE.flight_state === 'ABOVE_SERVICE_ALTITUDE') {
        acc.ASA++
      } else {
        acc.BSA++
      }
      return acc
    },
    { ASA: 0, BSA: 0 }
  )
}
```