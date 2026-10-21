import Foundation
import Capacitor

/// Exposes the user's iCloud key-value store to the web app, for small synced
/// data such as saved plants. Nothing goes to a Mebuki server: Apple syncs it
/// within the user's own iCloud account.
@objc(CloudKVPlugin)
public class CloudKVPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CloudKVPlugin"
    public let jsName = "CloudKV"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise)
    ]

    private let store = NSUbiquitousKeyValueStore.default

    override public func load() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(storeDidChangeExternally(_:)),
            name: NSUbiquitousKeyValueStore.didChangeExternallyNotification,
            object: store
        )
        store.synchronize()
    }

    @objc func get(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("key is required")
            return
        }
        call.resolve(["value": store.string(forKey: key) ?? NSNull()])
    }

    @objc func set(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), let value = call.getString("value") else {
            call.reject("key and value are required")
            return
        }
        store.set(value, forKey: key)
        store.synchronize()
        call.resolve()
    }

    @objc private func storeDidChangeExternally(_ notification: Notification) {
        let keys = notification.userInfo?[NSUbiquitousKeyValueStoreChangedKeysKey] as? [String] ?? []
        for key in keys {
            notifyListeners("change", data: ["key": key, "value": store.string(forKey: key) ?? NSNull()])
        }
    }
}
