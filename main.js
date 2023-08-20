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
    const paymentMethod = webhookEventData.data.paymentMethod; // credit_card || pix
    const paymentStatus = webhookEventData.data.status; // waiting_payment | refused

    // gerador
    const prefix = 'BR';
    const hash = "#";
    const apiBaseUrl = await this.data.get('API_BASE_URL'); // accessing api_base_url secret key


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

    const codigoAleatorio = gerador.geradorDeCodigo(100000000000, 999999999999) + prefix;
    const pedidoAleatorio = hash + gerador.geradorDePedido(10000000, 99999999);


    // create new random order
    async function createNewOrder() {
      try {
        // send post http request to create endpoint
        const url = `${apiBaseUrl}/create`

        // date
        const currentDate = new Date();
        const dia = currentDate.getDate();
        const mes = currentDate.getMonth() + 1;
        const ano = currentDate.getFullYear();
        

        const requestBody = {
          "trackCode": codigoAleatorio,
          "orderId": pedidoAleatorio,
          "registrationDate": `${ano}-${mes}-${dia}T01:00:00.000+00:00`,
          "CPF": CPF,
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



    // check payment status
    try {
      if (paymentStatus === "refused") {
        console.log(`• Status: Compra recusada.`)
        return;
      } 

      else if (paymentStatus === "waiting_payment") {
        console.log(`• Status: Pagamento pendente...`);

        paymentMethod === "pix" ? console.log(`• Pagamento ${clientFirstName}: Pedido feito pelo PIX.`) : console.log(`• Pagamento ${clientFirstName}: Pedido feito pelo cartao.`)

        // Logs the event body response
        console.log(`• Pagamento Pendente •\n

        - Nome completo: ${clientName}
        - CPF: ${CPF}
        - Status do pagamento: ${paymentStatus}\n
        • Body response do evento • :
        ####################
        `, webhookEventData,
          "\n####################"
        );
      }

      else {
        console.log(`• Status: Compra aprovada!`);

        paymentMethod === "pix" ? console.log(`• Pagamento ${clientFirstName}: Pedido feito pelo PIX.`) : console.log(`• Pagamento ${clientFirstName}: Pedido feito pelo cartao.`)

        // Logs the event body response
        console.log(`• Novo evento detectado •\n

        - Nome completo: ${clientName}
        - CPF: ${CPF}
        - Status do pagamento: ${paymentStatus}\n
        • Response body do evento • :
        ####################
        `, webhookEventData,
          "\n####################"
        );

        await createNewOrder();
      }
    }
    catch (err) {
      console.error("An error occurred:", err)
    }


  },
})
