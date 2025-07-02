# Project Estimation - CURRENT
Date: 05/05/2024

Version: V1.3


# Estimation approach
Consider the EZElectronics  project in CURRENT version (as given by the teachers), assume that you are going to develop the project INDEPENDENT of the deadlines of the course, and from scratch
# Estimate by size
### 
|             | Estimate                        |             
| ----------- | ------------------------------- |  
| NC =  Estimated number of classes to be developed   |        4 (user, product, carrello, negozio)                 |             
|  A = Estimated average size per class, in LOC       |            1700               | 
| S = Estimated size of project, in LOC (= NC * A) | 4*1700 = 6800|
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)  |               6800/10 = 680 person hours                        |   
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro) |30 * 680 = 20400| 
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) |     680/32 = 21,25 days; 5 weeks (4,25 week)               |               

# Estimate by product decomposition
### 
|         component name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
|Requirement document    | 100 |
| GUI prototype | 50|
|design document |15|
|code |500|
| unit tests |50|
| api tests |35|
| management documents  |8|



# Estimate by activity decomposition
### 
|         Activity name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
| *Documento dei requisiti* | |
| Colloquio con il cliente | 6 |
| Analisi dei requisiti | 40 |
| Stesura del documento | 60 |
| *GUI* | |
| Identificazione degli users and personas | 5 |
| Low fidelty prototype | 10 |
| High fidelty prototype | 30 |
| Testing e Focus Group | 5 |
| *Codice* |  |
| Design ad alto livello  | 15 |
| Scrittura del codice | 500 |
| *Unit Test* | |
| Identificazione dei test | 10 |
| Scrittura dei test | 40 |
| Svolgimento dei test e correzione del codice | 20 |
| *API Test* |  |
| Identificazione dei test | 4 |
| Scrittura dei test | 32 |
| Svolgimento dei test e correzione del codice | 12 |
| Consegna del prodotto| 4 |


###
![Gantt-v1](/images/Gantt-v2.png)

# Summary

L'inferiorità della stima by size è probabilmente derivata dal fatto che nelle seconde si tiene in conto anche di eventuali imprevisti e problematiche che potrebbero insorgere nella gestione dei task (che vengono visualizzati e stimati più nello specifico), laddove invece nella prima si calcola semplicemente il numero di ph (person hours) necessari per scrivere un numero di righe, considerando però una velocità "fissa" (in questo caso di 10 LOC per ph) senza nessuna variabilità data da eventi esterni. Inoltre la stima by LOC non tiene conto del fatto che un determinato numero di linee possa avere una grande varianza, dipendente dal tipo di componente che si sta sviluppando (in generale è comunque difficile fare una buona stima prima dell'inizio dello sviluppo), e inoltre non tiene conto, in modo esplicito, della parte di design/management che invece si stima negli altri due approcci. In questo caso, inoltre, la stima "by activity" è più alta rispetto alle altre, probabilmente per il fatto che i singoli task sono scomposti con una granularità più fine e quindi si tende ad avere più ph dati dall'overhead di management considerato in ognuno dei singoli task, rispetto a quella fatta nel "by product" in cui si considera un overhead complessivo ad un livello più alto (e quindi lo si conta "meno volte" e gli si da meno peso)

|             | Estimated effort                        |   Estimated duration |          
| ----------- | ------------------------------- | ---------------|
| estimate by size |680/32 ph | 5 weeks (4,25) |
| estimate by product decomposition | 758/32 ph| 5 weeks (4,7) |
| estimate by activity decomposition |1293/32 ph| 8 weeks (8) |




