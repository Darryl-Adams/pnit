exports.main = async (event) => {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Query endpoint is live!" })
    };
  };
  