#include "Misc/AutomationTest.h"
#include "SensorManagerComponent.h"
#include "WebSocketComponent.h"
#include "JsonUtilities.h"

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FSensorManagerComponentTest, "DigitalTwin.Sensors.ComponentTests",
    EAutomationTestFlags::ApplicationContextMask | EAutomationTestFlags::ProductFilter)

bool FSensorManagerComponentTest::RunTest(const FString& Parameters)
{
    // Crear componentes
    UWebSocketComponent* WebSocketComp = NewObject<UWebSocketComponent>();
    USensorManagerComponent* SensorManager = NewObject<USensorManagerComponent>();
    
    TestNotNull("SensorManager Component should be created", SensorManager);

    // Inicializar
    SensorManager->Initialize(WebSocketComp);

    // Probar recepción de datos
    bool DataReceived = false;
    SensorManager->OnSensorDataUpdated.AddLambda([&DataReceived](const FSensorData& Data) {
        DataReceived = true;
        // Verificar estructura de datos
        TestEqual("Sensor ID should match", Data.SensorId, "test_sensor");
        TestEqual("Sensor Type should match", Data.Type, "temperatura");
        TestEqual("Sensor Value should be valid", Data.Value, 25.5f);
    });

    // Simular mensaje WebSocket
    const FString TestMessage = "{\"type\":\"sensor_update\",\"data\":{\"sensor\":\"test_sensor\",\"tipo\":\"temperatura\",\"valor\":25.5,\"ubicacion\":\"test_location\"}}";
    WebSocketComp->OnMessage.Broadcast(TestMessage);

    // Verificar almacenamiento de datos
    TArray<FSensorData> AllData = SensorManager->GetAllSensorData();
    TestEqual("Should have one sensor data entry", AllData.Num(), 1);

    // Probar solicitud de datos
    SensorManager->RequestSensorData("test_sensor");

    return true;
} 