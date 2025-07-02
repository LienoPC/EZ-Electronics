# Graphical User Interface Prototype - CURRENT

Authors: Alberto Cagnazzo, Diego Da Giau, Paola Verrone, Lorenzo Ricci

Date: 28/04/2024

Version: V1.1


# Login e creazione dell'account (UC1, UC2)

### Schermata di login da cui accedono sia gli utenti Customer che i Manager. E' necessario fare il login per procedere nell'applicazione
![Login1](images/guiV1/Login1.png)

#### Nel caso di campi mancanti mostra un messaggio di errore

![LoginError](images/guiV1/LoginError.png)

#### Nel caso di credenziali errate mostra un messaggio di errore

![LoginErrorWrong](images/guiV1/LoginErrorWrong.png)

### Schermata di registrazione per la creazione di account (Customer e Manager)
![Login2](images/guiV1/Registration.png)

#### Nel caso di campi mancanti mostra un messaggio di errore, così come nel caso di username già esistente

![RegistrationMissingF](images/guiV1/RegistrationMissingF.png)

![RegistrationMissing](images/guiV1/RegistrationMissing.png)


### Schermata standard visualizzata dopo il login:

#### Customer

![StandardCustomer](images/guiV1/StandardCustomer.png)

#### Manager

![StandardManager](images/guiV1/StandardManager.png)


# Visualizzazione informazioni account e logout (UC3)

### Menu utente sulla schermata principale con i due link per visualizzare le informazioni e effettuare il logout

![Account1](images/guiV1/Account1.png)

### Finestra con le informazioni sull'account dell'utente loggato

![AccountInformations](images/guiV1/AccountInformations.png)

### Finestra di conferma del logout. L'utente viene poi rimandato alla pagina di login

![Logout](images/guiV1/LogoutConfirm.png)

# Ricerca di prodotti nel catalogo (UC4)

### Visualizzazione di tutti i prodotti, sia per Customer che per Manager, con la possibilità di effettuare la ricerca per codice prodotto tramite la barra superiore (opzione ricerca per Code abilitata di default. Nel caso in cui il sistema non trovi nulla, vi è un messaggio di errore.)

#### Customer
![StandardCustomer(Code)](images/guiV1/StandardCustomer(Code).png)

#### Manager

![StandardManager(Code)](images/guiV1/StandardManager(Code).png)

#### Code not found

![StandardCustomerCodeNot](images/guiV1/StandardCustomerCodeNot.png)


### Schermata di ricerca di un prodotto, dopo aver selezionato dal menu a tendina sulla barra superiore la ricerca per Modello. E' possibile quindi inserire il modello da cercare. E' possibile anche scegliere di visualizzare tutti i prodotti, solo quelli venduti e solo quelli non venduti. Nel caso in cui il sistema non trovi nulla, vi è un messaggio di errore.


#### Customer

![StandardCustomer(Model)](images/guiV1/StandardCustomer(Model).png)

#### Manager

![StandardManager(Model)](images/guiV1/StandardManager(Model).png)

#### Model not found

![StandardCustomerModelNot](images/guiV1/StandardCustomerModelNot.png)

### Schermata di ricerca di un prodotto, dopo aver selezionato dal menu a tendina sulla barra superiore la ricerca per Categoria. E' possibile quindi scegliere la categoria desiderata dal menu a tendina. E' possibile anche scegliere di visualizzare tutti i prodotti, solo quelli venduti e solo quelli non venduti

![StandardCustomer(Category)](images/guiV1/StandardCustomer(Category).png)


# Visualizzazione delle informazioni di un prodotto, inserimento di prodotti nel carrello, prodotto venduto e eliminazione di un prodotto dal catalogo (UC5, UC6, UC7)

### Sia il customer che il manager possono, dalle pagine di ricerca del caso precedente, premere il tasto details per vedere le informazioni dettagliate di un prodotto.

#### Nel caso del Customer è possibile da questa schermata leggere le informazioni e aggiungere il prodotto al carrello.

![ProductDetailsCustomerNotSold](images/guiV1/ProductDetailsCustomerNotSold.png)

#### E' mostrato anche il caso in cui il prodotto sia stato nel frattempo messo nel carrello da un altro cliente o il caso in cui sia già stato venduto.

![ProductDetailsCustomerSold](images/guiV1/ProductDetailsCustomerNotAvailable.png)

![ProductDetailsCustomerSold](images/guiV1/ProductDetailsCustomerSold.png)



#### Nel caso del Manager è possibile invece segnare il prodotto come venduto, nel caso in cui non sia ancora stato venduto, o rimuoverlo dal catalogo

![ProductDetailsManager](images/guiV1/ProductDetailsManager.png)

![ProductDetailsManagerSold](images/guiV1/ProductDetailsManagerSold.png)

#### Quando il manager segna il prodotto come venduto, inserisce la data di vendita, che deve essere valida. Se non si inserisce nulla viene settata di default la data odierna

![ProductDetailsManagerSetSold](images/guiV1/ProductDetailsManagerSetSold.png)

![ProductDetailsManagerWrongDate](images/guiV1/ProductDetailsManagerWrongDate.png)


# Gestione del carrello, checkout, consultazione dello storico (UC6, UC8)

### Il Customer può cliccare sull'icona del carrello nella barra in alto per vederne il contenuto e fare delle operazioni

#### Nel caso in cui il carrello sia vuoto il sistema stampa un messaggio

![EmptyCart](images/guiV1/EmptyCart.png)

#### Il cliente può quindi vedere tutti gli articoli che ha messo precedentemente nel carrello e li può eliminare selezionandoli dalla tabella e cliccando il tasto apposito. Può anche svuotare interamente il carrello. 

![CheckoutCustomer](images/guiV1/CheckoutCustomer.png)

#### Cliccando sul checkout il sistema chiede conferma dell'ordine e procede poi a svuotare il carrello

![CheckoutCustomerConfirm](images/guiV1/CheckoutCustomerConfirm.png)

#### Tramite il tasto "My Orders" della slide del carrello potrà poi accedere alla schermata dello Storico degli acquisti, che mostra la lista degli ordini passati con le informazioni associate

![CheckStorico](images/guiV1/CheckStorico.png)

#### Cliccando sui dettagli dell'ordine potrà vedere la lista di prodotti acquistati

![CheckDetailStorico](images/guiV1/CheckDetailStorico.png)


# Gestione dei prodotti (UC7)

### Il Manager può, cliccando sull'icona dei prodotti nella barra superiore, accedere alla schermata di gestione dei prodotti. Da qui, data la lista dei prodotti, può selezionarne uno e vederne i dettagli

![ProductManagement](images/guiV1/ProductManagement.png)

#### Cliccando sull'aggiunta di un prodotto, viene mostrata la schermata di creazione di un nuovo prodotto, con tutti i campi da inserire

![CreateNewProduct](images/guiV1/CreateNewProduct.png)

#### Nel caso di errori dell'inserimento il sistema mostra un messaggio di errore

![CreateNewProductWrong](images/guiV1/CreateNewProductWrong.png)

![CreateNewProductData](images/guiV1/CreateNewProductData.png)

![CreateNewProductNotUnique](images/guiV1/CreateNewProductNotUnique.png)

#### Cliccando sull'aggiunta di un set di prodotti, viene mostrata la schermata di creazione, con tutti i campi da inserire

![CreateSetOfProduct](images/guiV1/CreateSetofProducts.png)


#### Nel caso di errori dell'inserimento il sistema mostra un messaggio di errore

![CreateSetofProductsWrong](images/guiV1/CreateSetofProductsWrong.png)

![CreateSetofProductsWrongData](images/guiV1/CreateSetofProductsWrongData.png)

