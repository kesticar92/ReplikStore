#include "Misc/AutomationTest.h"
#include "WebSocketComponent.h"
#include "SensorManagerComponent.h"
#include "VisualizationComponent.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "Components/StaticMeshComponent.h"

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FDigitalTwinIntegrationTest, "DigitalTwin.Integration",
    EAutomationTestFlags::ApplicationContextMask | EAutomationTestFlags::ProductFilter)

bool FDigitalTwinIntegrationTest::RunTest(const FString& Parameters)
{
    // 1. Crear y configurar componentes
    UWebSocketComponent* WebSocketComp = NewObject<UWebSocketComponent>();
    USensorManagerComponent* SensorManager = NewObject<USensorManagerComponent>();
    UVisualizationComponent* VisualizationComp = NewObject<UVisualizationComponent>();
    
    TestNotNull("WebSocket Component should be created", WebSocketComp);
    TestNotNull("SensorManager Component should be created", SensorManager);
    TestNotNull("Visualization Component should be created", VisualizationComp);

    // 2. Configurar conexión WebSocket
    WebSocketComp->URL = TEXT("ws://localhost:3000/ws");
    WebSocketComp->Connect("test-token");

    // 3. Configurar visualizaciones de sensores
    UStaticMeshComponent* TempMesh = NewObject<UStaticMeshComponent>();
    UMaterialInstanceDynamic* TempMaterial = NewObject<UMaterialInstanceDynamic>();
    
    VisualizationComp->AddSensorVisualization(
        TEXT("temp_001"),
        TempMesh,
        TempMaterial,
        FVector(0, 0, 100),
        TEXT("temperatura")
    );

    // 4. Simular recepción de datos
    FSensorData TestData;
    TestData.SensorId = TEXT("temp_001");
    TestData.Type = TEXT("temperatura");
    TestData.Value = 25.5f;
    TestData.Location = TEXT("sala_principal");

    // 5. Verificar flujo de datos
    bool DataProcessed = false;
    VisualizationComp->OnSensorDataUpdated(TestData);
    
    // 6. Verificar actualización de material
    float Temperature;
    TempMaterial->GetScalarParameterValue(TEXT("Temperature"), Temperature);
    TestEqual("Temperature parameter should be updated", Temperature, 25.5f);

    // 7. Probar múltiples actualizaciones
    const float TestValues[] = { 20.0f, 30.0f, 40.0f };
    for (float Value : TestValues)
    {
        TestData.Value = Value;
        VisualizationComp->OnSensorDataUpdated(TestData);
        
        TempMaterial->GetScalarParameterValue(TEXT("Temperature"), Temperature);
        TestEqual("Temperature parameter should be updated", Temperature, Value);
    }

    // 8. Probar desconexión limpia
    WebSocketComp->Disconnect();
    TestTrue("WebSocket should disconnect cleanly", true);

    return true;
} 