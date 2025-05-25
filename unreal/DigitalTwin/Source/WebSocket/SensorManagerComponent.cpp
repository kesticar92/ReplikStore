#include "SensorManagerComponent.h"
#include "Json.h"
#include "JsonUtilities.h"

USensorManagerComponent::USensorManagerComponent()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void USensorManagerComponent::BeginPlay()
{
    Super::BeginPlay();
}

void USensorManagerComponent::Initialize(UWebSocketComponent* InWebSocket)
{
    if (InWebSocket)
    {
        WebSocketComponent = InWebSocket;
        WebSocketComponent->OnMessage.AddDynamic(this, &USensorManagerComponent::HandleWebSocketMessage);
    }
}

void USensorManagerComponent::RequestSensorData(const FString& SensorId)
{
    if (WebSocketComponent)
    {
        TSharedPtr<FJsonObject> RequestObj = MakeShared<FJsonObject>();
        RequestObj->SetStringField(TEXT("type"), TEXT("sensor_request"));
        RequestObj->SetStringField(TEXT("sensor"), SensorId);

        FString RequestMessage;
        TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&RequestMessage);
        FJsonSerializer::Serialize(RequestObj.ToSharedRef(), Writer);

        WebSocketComponent->SendMessage(RequestMessage);
    }
}

TArray<FSensorData> USensorManagerComponent::GetAllSensorData() const
{
    TArray<FSensorData> SensorDataArray;
    SensorDataMap.GenerateValueArray(SensorDataArray);
    return SensorDataArray;
}

void USensorManagerComponent::HandleWebSocketMessage(const FString& Message)
{
    ParseSensorData(Message);
}

void USensorManagerComponent::ParseSensorData(const FString& JsonString)
{
    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonString);

    if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid())
    {
        const TSharedPtr<FJsonObject>* DataObject;
        if (JsonObject->GetStringField("type") == "sensor_update" &&
            JsonObject->TryGetObjectField("data", DataObject))
        {
            FSensorData SensorData;
            SensorData.SensorId = (*DataObject)->GetStringField("sensor");
            SensorData.Type = (*DataObject)->GetStringField("tipo");
            SensorData.Value = (*DataObject)->GetNumberField("valor");
            SensorData.Location = (*DataObject)->GetStringField("ubicacion");
            
            FString TimestampStr = (*DataObject)->GetStringField("timestamp");
            FDateTime::ParseIso8601(*TimestampStr, SensorData.Timestamp);

            // Actualizar el mapa y notificar
            SensorDataMap.Add(SensorData.SensorId, SensorData);
            OnSensorDataUpdated.Broadcast(SensorData);
        }
    }
} 