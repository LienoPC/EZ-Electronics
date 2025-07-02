# Project Estimation - CURRENT
Date: 05/05/2024

Version: V1.4


# Estimation approach
Consider the EZElectronics  project in CURRENT version (as given by the teachers), assume that you are going to develop the project INDEPENDENT of the deadlines of the course, and from scratch
# Estimate by size
### 
|             | Estimate                        |             
| ----------- | ------------------------------- |  
| NC =  Estimated number of classes to be developed   |        3 (user, product, carrello)                 |             
|  A = Estimated average size per class, in LOC       |            900                | 
| S = Estimated size of project, in LOC (= NC * A) | 3*900 = 2700|
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)  |               2700/10 = 270 person hours                        |   
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro) |30 * 270 = 8100 | 
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) |    270/32= 8,5 days; 2 week              |               

# Estimate by product decomposition
### 
|         Component name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
|Requirement document    | 60 |
| GUI prototype | 25 |
|design document | 10 |
|code | 270 |
| unit tests | 20 |
| api tests | 15 |
| management documents  | 10 |
# Estimate by activity decomposition
### 
|         Activity name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
| **Documento dei requisiti** | |
| Colloquio con il cliente | 6 |
| Analisi dei requisiti | 28 |
| Stesura del documento | 34 |
| **GUI** | |
| Identificazione degli users and personas | 3 |
| Low fidelty prototype | 5 |
| High fidelty prototype | 20 |
| Testing e Focus Group | 3 |
| **Codice** |  |
| Design ad alto livello  | 8 |
| Scrittura del codice | 270 |
| **Unit Test** | |
| Identificazione dei test | 5 |
| Scrittura dei test | 25 |
| Svolgimento dei test e correzione del codice | 15 |
| **API Test** |  |
| Identificazione dei test | 3 |
| Scrittura dei test | 20 |
| Svolgimento dei test e correzione del codice | 10 |
| Consegna del prodotto| 2 |

###
![Gantt-v1](/images/Gantt-v1.png)

# Summary

La stima "by size" è nettamente inferiore alle altre due probabilmente perchè nelle seconde si tiene in conto anche di eventuali imprevisti e problematiche che potrebbero insorgere nella gestione dei task (che vengono visualizzati e stimati più nello specifico), laddove invece nella prima si calcola semplicemente il numero di ph (person hours) necessari per scrivere un numero di righe, considerando però una velocità "fissa" (in questo caso di 10 LOC per ph) senza nessuna variabilità data da eventi esterni. Inoltre la stima by LOC non tiene conto del fatto che un determinato numero di linee possa avere una grande varianza, dipendente dal tipo di componente che si sta sviluppando (in generale è comunque difficile fare una buona stima prima dell'inizio dello sviluppo), e inoltre non tiene conto, in modo esplicito, della parte di design/management che invece si stima negli altri due approcci.

|             | Estimated effort                        |   Estimated duration |          
| ----------- | ------------------------------- | ---------------|
| estimate by size |270/32 ph | 2 weeks (1,6 days)
| estimate by product decomposition |410/32 ph| 3 weeks (2,5 weeks)
| estimate by activity decomposition |457/32 ph| 3 weeks (2,9 weeks)




