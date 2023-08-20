// Pipedream Workflow w/ NodeJS app.

import axios from "axios"

export default defineComponent({
  // api creds stuff
  props: {
    data: { type: "data_store" },
  },
  async run({ event }) {

    // incoming response data is stored here
    const webhookEventData = event.body

    // client DETAILS..
    const clientName = webhookEventData.data.customer.name;
    const wordsArray = clientName.split(' ');
    const clientFirstName = wordsArray[0];
    const CPF = webhookEventData.data.customer.document.number

    // Payment details
    const pixData = webhookEventData.data.pix;
    const cardData = webhookEventData.data.card;
    const paymentStatus = webhookEventData.data.status; // waiting_payment | refused

    // gerador
    const prefix = 'BR';
    const hash = "#";
    const apiBaseUrl = await this.data.get('API_BASE_URL'); // accessing api_base_url secret key

    // Logs the event body response
    console.log(`
    
    • Novo evento detectado •\n

    - Nome completo: ${clientName}
    - CPF: ${CPF}
    - Status do pagamento: ${paymentStatus}\n
    • Response body do evento • :
    ##########################################
    `, webhookEventData,
      "\n##########################################");



    // order and track code generator
    class Gerador {
      geradorDeCodigo(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1) + min);
      }
  
      geradorDePedido(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1) + min);
      }
    }

    let gerador = new Gerador();

    const codigoAleatorio = gerador.geradorDeCodigo({ min: 100000000000, max: 999999999999 }) + prefix;
    const pedidoAleatorio = hash + gerador.geradorDePedido({ min: 10000000, max: 99999999 });



    // create new random order
    async function gerarRastreio() {
      try {
        // send post http request to create endpoint
        const url = `${apiBaseUrl}/create`

        const requestBody = {
          "trackCode": codigoAleatorio,
          "orderId": pedidoAleatorio,
          "followUp": [
            {
              "step1": true,
              "step2": false,
              "step3": false,
              "step4": false,
            }
          ]
        };

        const response = await axios.post(url, requestBody);

        console.log("POST Successful:", response.data);
      } catch (err) {
        console.error(err);
      };
    }

    // check whether it was an PIX or card transaction
    pixData === null ? null : console.log(`• Pagamento ${clientFirstName}: Pedido feito pelo PIX.`);
    cardData === null ? null : console.log(`• Pagamento ${clientFirstName}: Pedido feito pelo cartao.`);





    // check payment status
    
    if (paymentStatus === "refused") {
      console.log(`• Status: Compra recusada.`)
    } else if (paymentStatus === "waiting_payment") {
      console.log(`• Status: Pagamento pendente...`)
    }
    else {
      console.log(`• Status: Compra aprovada!`);
      gerarRastreio();
    }


  },
})
