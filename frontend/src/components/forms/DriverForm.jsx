export default function DriverForm({
    details,
    setDetails,
}) {

    function update(e){
        setDetails({
            ...details,
            [e.target.name]: e.target.value
        });
    }

    return (
        <>
            <label>
                License Class
                <input
                    name="licenseClass"
                    value={details.licenseClass || ""}
                    onChange={update}
                />
            </label>

            <label>
                Blood Type
                <input
                    name="bloodType"
                    value={details.bloodType || ""}
                    onChange={update}
                />
            </label>

            <label>
                Restrictions
                <input
                    name="restrictions"
                    value={details.restrictions || ""}
                    onChange={update}
                />
            </label>
        </>
    );
}