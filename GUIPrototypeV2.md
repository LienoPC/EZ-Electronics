# Graphical User Interface Prototype - FUTURE

Authors: Alberto Cagnazzo, Diego Da Giau, Paola Verrone, Lorenzo Ricci

Date: 04/05/2024

Version: V1.2


# Login, password recovery (UC2)

### Dalla schermata di navigazione da utente non loggato è possibile cliccare sull'icona dell'account, per essere rimandati poi alla schermata di login.

![StandardNotLoggedAccount](images/guiV2/StandardNotLoggedAccount.png)

![Login](images/guiV2/Login.png)

#### Nel caso di campi mancanti o di credenziali errate, il sistema mostra un errore

![LoginError](images/guiV2/LoginError.png)

![LoginError2](images/guiV2/LoginError2.png)

### Cliccando sul link di recupero password è possibile cominciare la procedura. Si inserisce prima la mail associata all'account, con un errore nel caso di email errata

![ForgotPassword](images/guiV2/ForgotPassword.png)

![ForgotPasswordEmailErr](images/guiV2/ForgotPasswordEmailErr.png)

#### L'utente dovrà poi inserire il codice ricevuto per email

![ForgotPassword2](images/guiV2/ForgotPassword2.png)

![ForgotPasswordCodeErr](images/guiV2/ForgotPasswordCodeErr.png)

#### Infine si avrà la possibilità di scegliere una nuova password. E' necessario soddisfare determinati requisiti minimi di sicurezza, altrimenti il sistema mostra un errore

![ForgotPassword3](images/guiV2/ForgotPassword3.png)

![ForgotPasswordPassErr](images/guiV2/ForgotPasswordPassErr.png)


# Creazione di un account (UC1)


### Cliccando su "sign up" dalla schermata di login è possibile creare un account (sia Customer che Manager)

![Registration](images/guiV2/Registration.png)

#### Nel caso di campi mancanti il sistema mostra un errore

![RegistrationMissing](images/guiV2/RegistrationMissing.png)

#### Nel caso di username o email già in uso il sistema mostra un errore

![RegistrationAlreadyUsername](images/guiV2/RegistrationAlreadyUsername.png)
![RegistrationAlreadyEmail](images/guiV2/RegistrationAlreadyEmail.png)

# Gestione dell'account (UC3)

### Cliccando sull'icona dell'account nella barra superiore è possibile accedere alla schermata di modifica dell'account, che contiene un riepilogo di tutte le informazioni sul profilo, ed effettuare il logout

![Logout](images/guiV2/Logout.png)

#### Il sistema chiede conferma per il logout

![LogoutConfirm](images/guiV2/LogoutConfirm.png)

#### Dalla schermata di modifica dell'account, è possibile aggiungere o eliminare un indirizzo di spedizione, oltre alla modifica di email, password o cancellazione dell'account

![AccountModify](images/guiV2/AccountModify.png)

#### Schermata di creazione di un nuovo indirizzo, con messaggio di errore nel caso di campi incompleti

![AccountAddress](images/guiV2/AccountAddress.png)


![AccountAddressWrong](images/guiV2/AccountAddressWrong.png)



#### Nella modifica della mail l'utente inserisce la nuova email e la passowrd. Il sistema verifica che l'email sia valida e che la password sia corretta e mostra un messaggio di errore nel caso negativo

![ModifyEmail](images/guiV2/ModifyEmail.png)


![ModifyEmailNotValid](images/guiV2/ModifyEmailNotValid.png)

![ModifyEmailWrong](images/guiV2/ModifyEmailWrong.png)

#### Nella modifica della password l'utente inserisce la vecchia e la nuova password. Il sistema verifica che la vecchia password sia corretta e che la nuova sia valida, mostrando un messaggio di errore nel caso negativo


![ChangePassword](images/guiV2/ChangePassword.png)


![ChangePasswordWrong](images/guiV2/ChangePasswordWrong.png)

![ChangePasswordNotValid](images/guiV2/ChangePasswordNotValid.png)

#### Nel caso di eliminazione dell'account, il sistema chiede conferma della password per completare l'operazione

![AccountDelete](images/guiV2/AccountDelete.png)

![AccountDeleteWrong](images/guiV2/AccountDeleteWrong.png)


# Ricerca di prodotti e visualizzazione dei dettagli di un prodotto (UC4, UC5)

### Dalla schermata standard per il cliente, che è possibile usare sia da utente loggato (Customer), che da utente non loggato, è possibile vedere la lista di tutti i prodotti (per modello) e ricercare per modello, applicando filtri sulla categoria e eventualmente decidendo di vedere solo i prodotti disponibili

#### Schermata da utente non loggato

![StandardNotLogged](images/guiV2/StandardNotLogged.png)

#### Schermata da utente customer

![StandardCustomer](images/guiV2/StandardCustomer.png)

![StandardCustomer(Filters)](images/guiV2/StandardCustomer(Filters).png)

#### Nel caso in cui il modello cercato non sia trovato, il sistema mostra un avviso

![StandardCustomerNotFound ](images/guiV2/StandardCustomerNotFound.png)

#### Cliccando sui dettagli di un modello è possibile vedere le informazioni associate e, per il Customer, aggiungere al carrello un prodotto del modello, se disponibile

![ProductDetailsCustomerNotSold](images/guiV2/ProductDetailsCustomerNotSold.png)


![ProductDetailsCustomerSold](images/guiV2/ProductDetailsCustomerSold.png)

#### Se invece l'utente non è loggato può solo vedere i dettagli

![ProductDetailsGuest](images/guiV2/ProductDetailsGuest.png)

### Il manager può, nella schermata di ricerca, oltre a vedere la lista di tutti i prodotti, ricercare sia per modello che per codice e applicare dei filtri sulla categoria e sulla visualizzazione di prodotti venduti/non venduti

#### Ricerca tramite codice. La schermata di ricerca tramite modello è uguale a quella del cliente

![StandardManager](images/guiV2/StandardManager.png)

![StandardManager(Filters)](images/guiV2/StandardManager(Filters).png)

#### Nel caso di codice non trovato

![StandardManagerCodeNot](images/guiV2/StandardManagerCodeNot.png)




# Gestione carrello, visualizzazione dello storico e acquisto di prodotti (UC6, UC7, UC8)

### Dalla barra superiore il Customer può cliccare sull'icona del carrello per visualizzare il riepilogo. Da questa pagina è possibile poi eseguire una serie di operazioni, come l'acquisto del carrello attuale, la consultazione dello storico e la rimozione di prodotti dal carrello. 

![Cart](images/guiV2/Cart.png)

#### E' possibile selezionare più prodotti alla volta e rimuoverli, oppure svuotare l'intero carrello

![CartMoreRemove](images/guiV2/CartMoreRemove.png)

#### Nel caso di carrello vuoto, il sistema mostra un avviso

![CartEmpty](images/guiV2/CartEmpty.png)

### Cliccando sul Checkout è possibile procedere con l'acquisto dei prodotti del carrello

#### Nel caso di carrello vuoto, il sistema mostra un messaggio di errore

![CartEmptyError](images/guiV2/CartEmptyError.png)

#### Da questa schermata si può selezionare l'indirizzo di spedizione, il metodo di pagamento e vedere il riepilogo dell'ordine

![CheckoutCustomer](images/guiV2/CheckoutCustomer.png)

#### Il cliente sceglie dalla lista di indirizzi che ha precedentemente inserito l'indirizzo di spedizione

![CheckoutCustomerSelectAddress](images/guiV2/CheckoutCustomerSelectAddress.png)


#### Nel caso in cui non venga scelto nessun indirizzo il sistema mostra un messaggio di errore

![CheckoutCustomer_2](images/guiV2/CheckoutCustomer_2.png)

#### Il cliente può anche visualizzare sulla mappa la posizione del negozio dove è situato il prodotto

![CheckoutCustomerMaps](images/guiV2/CheckoutCustomerMaps.png)

#### Il cliente può quindi procedere all'acquisto cliccando sul tasto apposito: il sistema lo rimanderà al servizio di pagamento che ha scelto

![CheckoutCustomer_3](images/guiV2/CheckoutCustomer_3.png)

![CheckoutCustomerPayment](images/guiV2/CheckoutCustomerPayment.png)

### Cliccando sul tasto MyOrders il cliente può vedere la lista dei suoi ordini passati, con tutte le informazioni associate e vedere i dettagli di un ordine selezionandolo dalla tabella

![CheckStorico](images/guiV2/CheckStorico.png)

#### Dettagli dell'ordine

![CheckDetailStorico](images/guiV2/CheckDetailStorico.png)



# Gestione dei prodotti (UC15)

### Dalla schermata dei dettagli di un prodotto, dopo aver cercato e selezionato il prodotto desiderato, il manager può vedere le informazioni, segnare il prodotto come venduto oppure rimuoverlo dal catalogo


![StandardManager](images/guiV2/StandardManager.png)


![ProductDetailsManager](images/guiV2/ProductDetailsManager.png)

#### Cliccando il pulsante apposito, il manager inserirà poi la data di vendita. Nel caso in cui il campo sia lasciato vuoto, corrisponderà alla data odierna

![ProductDetailsManagerSoldDate](images/guiV2/ProductDetailsManagerSoldDate.png)

#### Il sistema controlla che la data sia valida e mostra un errore

![ProductDetailsManagerSoldWrong](images/guiV2/ProductDetailsManagerSoldWrong.png)

#### Nel caso in cui il prodotto fosse già venduto, tra le informazioni ci sarà anche la data di vendita e il manager potrà soltanto rimuoverlo dal catalogo

![ProductDetailsManagerSold](images/guiV2/ProductDetailsManagerSold.png)

### Cliccando sul bottone dei prodotti nella barra superiore, il manager accede alla scheda di gestione dei prodotti, dalla quale può creare un nuovo modello (set di prodotti dello stesso tipo), modificare le informazioni di uno esistente o aggiungere dei nuovi arrivi ad uno dei modelli

![ProductManagement](images/guiV2/ProductManagement.png)

#### Selezionando la creazione di un nuovo prodotto, il manager dovrà inserire tutti i campi necessari e confermare l'inserimento

![CreateProducts](images/guiV2/CreateProducts.png)

#### Il sistema controlla la presenza di tutti i campi e eventualmente segnala con un errore la mancanza di quelli obbligatori. Nel caso in cui il campo della data non sia completo, il sistema la setta a quella odierna

![CreateProductsMissing](images/guiV2/CreateProductsMissing.png)


![CreateProductsWrong](images/guiV2/CreateProductsWrong.png)


### Selezionando la modifica delle informazioni di un modello, viene mostrata una schermata con tutte le informazioni che è possibile cambiare. 

![ProductChangeInformations](images/guiV2/ProductChangeInformations.png)

#### Il sistema controlla la presenza di tutti i campi e eventualmente mostra un messaggio di errore

![ProductChangeInformationsMissing](images/guiV2/ProductChangeInformationsMissing.png)




### Selezionando un modello e cliccando sull'aggiunta di nuovi arrivi, viene mostrata una schermata in cui è possibile selezionare il negozio di arrivo, la quantità e la data di arrivo


![ProductManagementRefill](images/guiV2/ProductManagementRefill.png)

#### Il sistema verifica la data inserita e eventualmente mostra un messaggio di errore

![ProductManagementRefillWrong](images/guiV2/ProductManagementRefillWrong.png)

#### Il sistema verifica anche la presenza di tutti i campi e eventualmente mostra un messaggio di errore


![ProductManagementRefillMissing](images/guiV2/ProductManagementRefillMissing.png)




# Gestione dei negozi (UC9)


### Cliccando sul bottone del negozio nella barra superiore, il manager accede alla scheda di gestione dei negozi, dalla quale può vedere la lista di tutti i negozi, vedere le informazioni associate, crearne di nuovi e modificare le informazioni di quelli esistenti


#### Cliccando sul link della mappa il sistema rimanda alla posizione del negozio sul sistema esterno di localizzazione

![ShopsManagement](images/guiV2/ShopsManagement.png)



#### Cliccando sulla creazione di un nuovo negozio si rimanda ad una schermata di creazione in cui il manager inserirà tutti i campi necessari


![AddNewShop](images/guiV2/AddNewShop.png)

#### Nel caso in cui il nome inserito esista già, il sistema mostra un messaggio di errore

![AddNewShopAlready](images/guiV2/AddNewShopAlready.png)

#### Il sistema controlla anche che tutti i campi siano presenti ed eventualmente mostra un messaggio di errore

![AddNewShopMissing](images/guiV2/AddNewShopMissing.png)


### Cliccando sulla modifica delle informazioni di un negozio il sistema mostra una scheda con tutti i campi precompilati e che il manager può cambiare.

![ChangeShopInformations](images/guiV2/ChangeShopInformations.png)

#### Anche in questo caso il sistema verifica l'unicità del nome e la presenza di tutti i campi

![ChangeShopInformationsAlready](images/guiV2/ChangeShopInformationsAlready.png)


![ChangeShopInformationsErr](images/guiV2/ChangeShopInformationsErr.png)


