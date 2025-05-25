import unreal
import json
import os

def normalize_path(path):
    """
    Normaliza una ruta para asegurar que comience con /Game/
    """
    if not path.startswith('/Game/'):
        path = path.strip('/')
        path = f'/Game/{path}'
    return path

def force_delete_asset(asset_path):
    """
    Fuerza la eliminación de un asset y sus referencias
    """
    try:
        if unreal.EditorAssetLibrary.does_asset_exist(asset_path):
            # Intentar eliminar referencias
            unreal.EditorAssetLibrary.delete_loaded_asset(asset_path)
            print(f'Asset eliminado: {asset_path}')
            return True
    except Exception as e:
        print(f'Error al eliminar asset {asset_path}: {str(e)}')
    return False

def create_blueprint(parent_class, name, folder_path, force_recreate=True):
    """
    Crea un nuevo Blueprint con la clase padre y nombre especificados
    """
    try:
        # Normalizar la ruta
        full_path = normalize_path(folder_path)
        package_path = f"{full_path}/{name}"
        
        # Si existe y force_recreate es True, intentar eliminar
        if force_recreate:
            force_delete_asset(package_path)
            
        # Crear el factory para Blueprints
        factory = unreal.BlueprintFactory()
        factory.set_editor_property('ParentClass', parent_class)
        
        # Obtener el asset tools
        asset_tools = unreal.AssetToolsHelpers.get_asset_tools()
        
        # Asegurarse de que el directorio existe
        package_name = unreal.Paths.get_base_filename(package_path)
        package_folder = unreal.Paths.get_path(package_path)
        
        if not unreal.EditorAssetLibrary.does_directory_exist(package_folder):
            unreal.EditorAssetLibrary.make_directory(package_folder)
        
        # Crear el Blueprint
        new_blueprint = asset_tools.create_asset(
            package_name,
            package_folder,
            unreal.Blueprint,
            factory
        )
        
        if new_blueprint is not None:
            # Forzar la compilación del Blueprint
            unreal.EditorLoadingAndSavingUtils.save_dirty_packages(
                save_map_packages=True,
                save_content_packages=True
            )
            print(f'Blueprint creado y guardado: {package_path}')
            return new_blueprint
        else:
            print(f'Error al crear Blueprint: {package_path}')
            return None
            
    except Exception as e:
        print(f'Error al crear Blueprint {name}: {str(e)}')
        return None

def clean_directory(directory_path):
    """
    Limpia un directorio eliminando todos los assets
    """
    try:
        if unreal.EditorAssetLibrary.does_directory_exist(directory_path):
            assets = unreal.EditorAssetLibrary.list_assets(directory_path)
            for asset in assets:
                force_delete_asset(asset)
            print(f'Directorio limpiado: {directory_path}')
    except Exception as e:
        print(f'Error al limpiar directorio {directory_path}: {str(e)}')

def setup_digital_twin():
    """
    Configura todos los Blueprints necesarios para el gemelo digital
    """
    try:
        # Limpiar directorios existentes
        base_folders = [
            'Blueprints/Core',
            'Blueprints/Security',
            'Blueprints/Inventory',
            'Blueprints/Customer',
            'Blueprints/Layout',
            'Blueprints/Help'
        ]
        
        print('Limpiando directorios existentes...')
        for folder in base_folders:
            path = normalize_path(folder)
            clean_directory(path)
            if not unreal.EditorAssetLibrary.does_directory_exist(path):
                unreal.EditorAssetLibrary.make_directory(path)
                print(f'Directorio creado: {path}')
        
        # Forzar una recolección de basura
        unreal.EditorLevelLibrary.editor_command('GC.CollectGarbage')
        
        print('Creando nuevos Blueprints...')
        
        # Crear GameMode principal
        game_mode = create_blueprint(
            unreal.GameModeBase.static_class(),
            'BP_DigitalTwinGameMode',
            '/Game/Blueprints/Core',
            force_recreate=True
        )
        
        # Definir sistemas principales
        systems = {
            'Blueprints/Security': {
                'BP_SecurityCamera': unreal.Actor.static_class(),
                'BP_SecuritySystem': unreal.Actor.static_class()
            },
            'Blueprints/Inventory': {
                'BP_InventoryManager': unreal.Actor.static_class(),
                'BP_Product': unreal.Actor.static_class()
            },
            'Blueprints/Customer': {
                'BP_CustomerSimulation': unreal.Actor.static_class(),
                'BP_VirtualCustomer': unreal.Character.static_class()
            },
            'Blueprints/Layout': {
                'BP_LayoutEditor': unreal.Actor.static_class(),
                'BP_LayoutValidator': unreal.Actor.static_class()
            },
            'Blueprints/Help': {
                'WBP_HelpSystem': unreal.WidgetBlueprint.static_class(),
                'BP_TutorialManager': unreal.Actor.static_class()
            }
        }
        
        created_blueprints = {}
        
        # Crear Blueprints para cada sistema
        for folder_path, blueprints in systems.items():
            normalized_path = normalize_path(folder_path)
            folder_name = folder_path.split('/')[-1]
            created_blueprints[folder_name] = {}
            
            for bp_name, parent_class in blueprints.items():
                bp = create_blueprint(parent_class, bp_name, normalized_path, force_recreate=True)
                if bp is not None:
                    created_blueprints[folder_name][bp_name] = bp
        
        # Forzar guardado de todos los paquetes
        unreal.EditorLoadingAndSavingUtils.save_dirty_packages(
            save_map_packages=True,
            save_content_packages=True
        )
        
        print('Configuración del gemelo digital completada')
        
    except Exception as e:
        print(f'Error durante la configuración: {str(e)}')

def generate_websocket_blueprint():
    # Configuración básica del Blueprint
    blueprint_name = '/Game/Blueprints/BP_WebSocketManager'
    blueprint_factory = unreal.BlueprintFactory()
    blueprint_factory.set_editor_property('ParentClass', unreal.Actor)
    
    # Crear el Blueprint
    package_path = '/Game/Blueprints'
    blueprint = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
        'BP_WebSocketManager',
        package_path,
        unreal.Blueprint,
        blueprint_factory
    )
    
    # Añadir variables
    blueprint_class = blueprint.get_blueprint_class()
    
    # Variables para WebSocket
    unreal.BlueprintVariable(
        'WebSocketURL',
        unreal.EdGraphPinType(
            'string',
            'ESPMode::Type::ThreadSafe',
            None,
            unreal.EPinContainerType.NONE,
            False,
            unreal.FEdGraphTerminalType()
        )
    )
    
    # Funciones principales
    functions = [
        {
            'name': 'ConnectToServer',
            'inputs': [],
            'outputs': [('Success', 'bool')]
        },
        {
            'name': 'ProcessSensorData',
            'inputs': [('SensorData', 'string')],
            'outputs': []
        },
        {
            'name': 'UpdateDigitalTwin',
            'inputs': [
                ('Temperature', 'float'),
                ('Humidity', 'float'),
                ('Pressure', 'float'),
                ('Motion', 'bool'),
                ('Stock', 'int')
            ],
            'outputs': []
        }
    ]
    
    # Crear funciones
    for func in functions:
        function = unreal.BlueprintFunctionLibrary.create_function(
            blueprint_class,
            func['name']
        )
        
        # Añadir inputs y outputs
        for input_name, input_type in func['inputs']:
            unreal.BlueprintFunctionLibrary.add_parameter(
                function,
                unreal.Parameter(input_name, input_type)
            )
        
        for output_name, output_type in func['outputs']:
            unreal.BlueprintFunctionLibrary.add_return_value(
                function,
                unreal.Parameter(output_name, output_type)
            )
    
    # Compilar Blueprint
    unreal.EditorLoadingAndSavingUtils.save_package(
        blueprint.get_outer(),
        '/Game/Blueprints/BP_WebSocketManager'
    )
    
if __name__ == '__main__':
    setup_digital_twin()
    generate_websocket_blueprint() 