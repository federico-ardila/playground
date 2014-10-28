
#r @"c:\users\federico\documents\visual studio 2013\Projects\Playground\packages\FSharp.Data.2.0.15\lib\net40\FSharp.Data.dll"
#r @"c:\users\federico\documents\visual studio 2013\Projects\Playground\packages\FSharp.Charting.0.90.7\lib\net40\FSharp.Charting.dll"
#load @"c:\users\federico\documents\visual studio 2013\Projects\Playground\packages\FSharp.Charting.0.90.7\FSharp.Charting.fsx"

open FSharp.Data
open FSharp.Charting
open System

let dataContext = WorldBankData.GetDataContext()

type Indicator = Runtime.WorldBank.Indicator
type Country = WorldBankData.ServiceTypes.Country


let ``filter last X years`` (x:int) (indicator:Indicator)  = 
    indicator
    |> Seq.filter (fun (year, value) -> year >= DateTime.Now.Year - x)

let ``Average Higher first`` (c:Country, values: seq<int * float>) = 
    if (Seq.isEmpty values)
    then 0.0 
    else values |> Seq.averageBy (fun (y,v) -> -v)
    

let ``Chart top X in the last Y years``(filter: Country -> bool) (x:int) (y:int) (getIndicator: Country -> Indicator)  =
    let indicatorName = getIndicator dataContext.Countries.``European Union`` |> (fun i -> i.Name)
    dataContext.Countries
    |> Seq.filter filter
    |> Seq.map (fun c -> (c, getIndicator c |> ``filter last X years`` y))
    |> Seq.sortBy ``Average Higher first``
    |> Seq.take x
    |> Seq.map (fun (c, values) ->  Chart.Line(values, c.Name, indicatorName))
    |> Chart.Combine 

let ``All Countries (no filter)`` (country:Country) = true

let ``At leat 1 biliion GDP`` (country:Country) = 
    Math.Pow(10.0 , 9.0) <=  (country.Indicators.``GDP (current US$)``
                                |> Seq.map (fun (y,v)-> v) |> fun s -> if Seq.isEmpty s then 0.0 else Seq.last s) 



let `` Chart top 10 in the last 20 Years with at least 1 bilion GDP`` = ``Chart top X in the last Y years`` ``At leat 1 biliion GDP`` 10 20


`` Chart top 10 in the last 20 Years with at least 1 bilion GDP``  (fun c -> c.Indicators.``Health expenditure, public (% of GDP)``)

Chart.Line (dataContext.Countries.Cuba.Indicators.``GDP (current US$)`` |> ``filter last X years`` 20,
            dataContext.Countries.Cuba.Name, "Cuba - "+ dataContext.Countries.Cuba.Indicators.``GDP (current US$)``.Name) 

let countries = 
    [|dataContext.Countries.``United States``;
       dataContext.Countries.``Euro area``;
       dataContext.Countries.``Latin America & Caribbean (all income levels)``;
       dataContext.Countries.Cuba|]
        
let ``2008 = 100%`` (values: seq<int*float>) = 
    let ``2008 value`` = Seq.find (fun (y,v) -> y = 2008) values |> (fun (y,v) -> v)
    Seq.map (fun (y,v) -> (y, (100.0* v) / ``2008 value``)) values

countries
|> Seq.map (fun c -> 
                (c , c.Indicators.``GDP (current US$)``                
                |>``filter last X years`` 8
                |> ``2008 = 100%``))
|> Seq.map (fun (c, values) ->  Chart.Line(values, c.Name, "GDP (current US$)"))
|> Chart.Combine 