import Router from "express/lib/router";

const app = Router();

const getOrchestrators = async (req, res, next) => {
  const orchestrators = await req.getOrchestrators(req);

  return res.json(
    orchestrators.map(({ address, score }) => ({ address, score }))
  );
};

app.get("/", getOrchestrators);
app.get("/ext/:token", getOrchestrators);

async function discoveryAuthWebhookHandler(req, res) {
  const responseObj = {};
  let prices = [];
  try {
    prices = await req.getPrices();
  } catch (err) {
    return res.status(400).send({ message: err.message });
  }
  for (let i = 0; i < prices.length; i++) {
    if (prices[i].address.toLowerCase() == req.body.id.toLowerCase()) {
      responseObj["priceInfo"] = prices[i].priceInfo;
      break;
    }
  }
  return res.status(200).json(responseObj);
}

app.post("/hook/auth", discoveryAuthWebhookHandler);

export default app;
