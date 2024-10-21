const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-south-1' });

const dynamodb = new AWS.DynamoDB.DocumentClient();

const addCar = async (req, res) => {
  const {
    owner, model, year, transmission, color, insurance, purchaseDate, originalPrice,
    refurb, interestRate, photo, video, fuel, profitMargin, negotiationBuffer, currentPrice, suggestedPrice
  } = req.body;

  const params = {
    TableName: 'Cars',
    Item: {
      owner,
      model,
      year,
      transmission,
      color,
      insurance,
      purchaseDate,
      originalPrice,
      refurb,
      interestRate,
      photo,
      video,
      fuel,
      profitMargin,
      negotiationBuffer,
      currentPrice,
      suggestedPrice
    }
  };

  try {
    await dynamodb.put(params).promise();
    res.status(200).json({ message: 'Car added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error adding car' });
  }
};

module.exports = addCar;